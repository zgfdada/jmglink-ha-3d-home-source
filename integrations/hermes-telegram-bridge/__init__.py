"""A bounded LAN ingress for an existing Hermes Telegram adapter.

No second agent, Telegram poller, or session database writer is created. All
turns go through the live Telegram adapter's normal authorization/session lane.
"""
import asyncio
import hashlib
import hmac
import os
import re
import time
import logging

from aiohttp import web
from gateway.config import Platform
from gateway.platforms.base import BasePlatformAdapter, MessageEvent, SendResult
from gateway.session import SessionSource, build_session_key


class TelegramBridge(BasePlatformAdapter):
    def __init__(self, config):
        super().__init__(config, Platform("ha3d_bridge"))
        self.key = os.getenv("HA3D_BRIDGE_KEY", "")
        self.chat_id = os.getenv("HA3D_TG_CHAT_ID", "")
        self.user_id = os.getenv("HA3D_TG_USER_ID", "")
        self.thread_id = os.getenv("HA3D_TG_THREAD_ID") or None
        self.chat_type = os.getenv("HA3D_TG_CHAT_TYPE", "dm")
        self.bot_username = os.getenv("HA3D_TG_BOT_USERNAME", "").lstrip("@")
        self.host = os.getenv("HA3D_BRIDGE_HOST", "127.0.0.1")
        self.port = int(os.getenv("HA3D_BRIDGE_PORT", "8645"))
        self.cache = {}
        self.runner = None
        self.lock = asyncio.Lock()
        self.jobs = {}
        self.active_request = None

    async def connect(self, *, is_reconnect=False):
        if len(self.key) < 32 or not self.chat_id or not self.user_id:
            return False
        app = web.Application(client_max_size=16384)
        app.router.add_get('/v1/models', self.models)
        app.router.add_post('/v1/chat/completions', self.chat)
        app.router.add_get('/v1/requests/{request_id}', self.progress)
        app.router.add_post('/v1/requests/{request_id}/answer', self.answer)
        self.runner = web.AppRunner(app, access_log=None)
        await self.runner.setup()
        await web.TCPSite(self.runner, self.host, self.port).start()
        self._running = True
        return True

    async def disconnect(self):
        self._running = False
        if self.runner:
            await self.runner.cleanup()

    async def send(self, chat_id, content, reply_to=None, metadata=None):
        return SendResult(success=False, error='Bridge only accepts inbound requests')

    async def get_chat_info(self, chat_id):
        return {'name':'3D Home ingress', 'type':'bridge'}

    def authorized(self, request):
        provided = request.headers.get('Authorization', '')
        return bool(self.key) and hmac.compare_digest(provided.encode(), ('Bearer '+self.key).encode())

    def telegram(self):
        owner = getattr(self._message_handler, '__self__', None)
        return getattr(owner, 'adapters', {}).get(Platform.TELEGRAM)

    def source(self):
        return SessionSource(platform=Platform.TELEGRAM, chat_id=self.chat_id,
            chat_type=self.chat_type, user_id=self.user_id, thread_id=self.thread_id)

    def identity(self):
        return {'mode':'telegram_shared', 'botUsername':self.bot_username,
            'chatId':self.chat_id, 'threadId':self.thread_id}

    async def models(self, request):
        if not self.authorized(request):
            return web.json_response({'error':'Unauthorized'}, status=401)
        if not self.telegram():
            return web.json_response({'error':'Telegram adapter is not ready'}, status=503)
        return web.json_response({'object':'list','data':[{'id':'tghome','object':'model'}], 'ha3d':self.identity()})

    def pending(self, job):
        prompt = job.get('clarification')
        if not prompt or job['task'].done():
            return None
        from tools import clarify_gateway
        with clarify_gateway._lock:
            entry = clarify_gateway._entries.get(prompt['id'])
            if entry is None or entry.session_key != job['session_key'] or entry.event.is_set():
                return None
        return prompt

    async def progress(self, request):
        if not self.authorized(request):
            return web.json_response({'error':'Unauthorized'}, status=401)
        job = self.jobs.get(request.match_info['request_id'])
        if not job:
            return web.json_response({'error':'Unknown request'}, status=404)
        prompt = self.pending(job)
        if job['task'].done():
            state = 'failed' if job['task'].cancelled() or job['task'].exception() else 'completed'
        else:
            state = 'waiting_for_input' if prompt else 'running'
        return web.json_response({'state':state, 'clarification':prompt}, headers={'Cache-Control':'no-store'})

    async def answer(self, request):
        if not self.authorized(request):
            return web.json_response({'error':'Unauthorized'}, status=401)
        job = self.jobs.get(request.match_info['request_id'])
        if not job:
            return web.json_response({'error':'Unknown request'}, status=404)
        try:
            body = await request.json()
            answer = body['answer'].strip()
            prompt = self.pending(job)
            if not answer or len(answer)>2000 or answer.startswith('/'):
                raise ValueError()
            if not prompt or body['clarificationId'] != prompt['id']:
                return web.json_response({'error':'Question already answered or expired'}, status=409)
        except (ValueError, KeyError, TypeError, AttributeError):
            return web.json_response({'error':'Invalid answer'}, status=400)
        from tools import clarify_gateway
        # TG callbacks and browser clicks resolve the same primitive; never
        # enqueue a second turn or accidentally answer the next question.
        with clarify_gateway._lock:
            entry = clarify_gateway._entries.get(prompt['id'])
            if entry is None or entry.event.is_set() or entry.session_key != job['session_key']:
                return web.json_response({'error':'Question already answered or expired'}, status=409)
            clarify_gateway.resolve_gateway_clarify(prompt['id'], answer)
        job['clarification'] = None
        return web.json_response({'ok':True})

    async def chat(self, request):
        if not self.authorized(request):
            return web.json_response({'error':'Unauthorized'}, status=401)
        try:
            body = await request.json()
            messages = body.get('messages', [])
            text = messages[0]['content'].strip()
            request_id = body['request_id']
            execution_timeout = body.get('execution_timeout', 300)
            if not isinstance(execution_timeout, int) or not 10 <= execution_timeout <= 300:
                raise ValueError()
            if (len(messages) != 1 or messages[0]['role'] != 'user' or not isinstance(text, str)
                or not text or len(text) > 2000 or text.startswith('/') or body.get('stream')
                or not re.fullmatch(r'[A-Za-z0-9_-]{16,80}', request_id)):
                raise ValueError()
        except (ValueError, KeyError, TypeError, IndexError, AttributeError):
            return web.json_response({'error':'Expected one natural-language user message and request_id'}, status=400)
        # Keep failures/unknown outcomes too: a client retry must never re-run
        # a physical action merely because delivery or its HTTP request failed.
        for key, value in list(self.cache.items()):
            if value[0] < time.monotonic() and value[2].done():
                self.cache.pop(key, None)
                self.jobs.pop(key, None)
        digest = hashlib.sha256(text.encode()).hexdigest()
        entry = self.cache.get(request_id)
        if entry:
            if entry[1] != digest:
                return web.json_response({'error':'request_id conflict'}, status=409)
            return await self.result(entry[2])
        if len(self.cache) >= 256:
            return web.json_response({'error':'Request cache full'}, status=429)
        if self.lock.locked():
            return web.json_response({'error':'Telegram conversation is busy'}, status=409)
        tg = self.telegram()
        if not tg:
            return web.json_response({'error':'Telegram adapter unavailable'}, status=503)
        source = self.source()
        tg_key = build_session_key(source,
            group_sessions_per_user=tg.config.extra.get('group_sessions_per_user', True),
            thread_sessions_per_user=tg.config.extra.get('thread_sessions_per_user', False))
        if tg_key in tg._active_sessions:
            return web.json_response({'error':'Telegram conversation is busy; no message was sent'}, status=409)
        # Hermes' primitive accepts a second answer until its worker removes
        # the entry. Guard this bridge's session so simultaneous TG/web answers
        # cannot overwrite the first result during that short window.
        from tools import clarify_gateway
        if not hasattr(clarify_gateway, '_ha3d_sessions'):
            clarify_gateway._ha3d_sessions = set()
            native_resolve = clarify_gateway.resolve_gateway_clarify
            def resolve_once(clarify_id, response):
                with clarify_gateway._lock:
                    entry = clarify_gateway._entries.get(clarify_id)
                    if entry and entry.session_key in clarify_gateway._ha3d_sessions and entry.event.is_set():
                        return False
                    return native_resolve(clarify_id, response)
            clarify_gateway.resolve_gateway_clarify = resolve_once
        clarify_gateway._ha3d_sessions.add(tg_key)
        # Install one forwarding observer. The native adapter remains responsible
        # for policy checks, session locking, transcript writes and TG delivery.
        if not getattr(tg, '_ha3d_observer_installed', False):
            original = tg._message_handler
            native_clarify = tg.send_clarify
            async def observe_clarify(*args, **kwargs):
                delivered = await native_clarify(*args, **kwargs)
                job = self.jobs.get(self.active_request)
                if job and kwargs.get('session_key') == job['session_key'] and getattr(delivered, 'success', False):
                    job['clarification'] = {
                        'id':kwargs['clarify_id'], 'question':str(kwargs['question']),
                        'choices':[str(item) for item in (kwargs.get('choices') or [])],
                    }
                return delivered
            tg.send_clarify = observe_clarify
            async def observed(event):
                future = getattr(event, '_ha3d_result', None)
                store = getattr(getattr(original, '__self__', None), 'session_store', None)
                before_id = None
                before_count = 0
                try:
                    if future is not None:
                        if store is not None:
                            entry = store.get_or_create_session(event.source)
                            before_id = entry.session_id
                            before_count = len(store.load_transcript(before_id))
                        metadata = {'thread_id':event.source.thread_id} if event.source.thread_id else None
                        echo = await tg.send(event.source.chat_id, '来自 3D Home：\n'+event.text, metadata=metadata)
                        if not echo.success:
                            raise RuntimeError('Could not mirror request to Telegram; not executed')
                    result = await original(event)
                    native_result = result
                    if isinstance(native_result, dict):
                        native_result = None if native_result.get('already_sent') else native_result.get('final_response')
                    if future is not None and result is None and store is not None:
                        # Current Hermes returns None once streaming has already
                        # delivered to TG. Read the newly persisted final reply
                        # from this same session, never another session or an old
                        # assistant turn. No transcript is written by this bridge.
                        entry = store.get_or_create_session(event.source)
                        rows = store.load_transcript(entry.session_id)
                        fresh = rows[before_count:] if entry.session_id == before_id else rows
                        last_user = next((i for i in range(len(fresh)-1,-1,-1) if fresh[i].get('role')=='user'), None)
                        if last_user is not None and event.text in str(fresh[last_user].get('content','')):
                            final = next((row.get('content') for row in reversed(fresh[last_user+1:]) if row.get('role')=='assistant' and not row.get('tool_calls') and isinstance(row.get('content'),str)), None)
                            if final:
                                result = {'final_response':final, 'already_sent':True}
                    if future is not None and not future.done():
                        future.set_result(result)
                    return native_result
                except BaseException as exc:
                    if future is not None and not future.done():
                        future.set_exception(RuntimeError('Telegram turn failed; execution status unknown'))
                    raise
            tg.set_message_handler(observed)
            tg._ha3d_observer_installed = True
        future = asyncio.get_running_loop().create_future()
        event = MessageEvent(text=text, source=source)
        event._ha3d_result = future
        async def execute():
            async with self.lock:
                self.active_request = request_id
                await tg.handle_message(event)
                # handle_message owns a background task. Waiting for it also
                # waits for the native final response delivery to Telegram.
                task = tg._session_tasks.get(tg_key)
                if task is not None:
                    await asyncio.shield(task)
                if not future.done():
                    raise RuntimeError('Turn was not completed; execution status unknown')
                result = future.result()
                if isinstance(result, dict):
                    # Hermes marks streamed replies already_sent so the native
                    # adapter won't post them twice. The web client still needs
                    # the final_response field from that result.
                    text_result = result.get('final_response')
                else:
                    text_result, _ = tg._unwrap_ephemeral(result)
                if not text_result:
                    raise RuntimeError('Agent returned no final text; execution status unknown')
                return str(text_result)
        task = asyncio.create_task(execute())
        task._ha3d_execution_timeout = execution_timeout
        self.cache[request_id] = (time.monotonic()+3600, digest, task)
        self.jobs[request_id] = {'task':task, 'session_key':tg_key, 'clarification':None}
        return await self.result(task)

    async def result(self, task):
        try:
            spent = 0.0
            started = time.monotonic()
            while not task.done():
                tick = time.monotonic()
                job = next((job for job in self.jobs.values() if job['task'] is task), None)
                waiting = bool(job and self.pending(job))
                try:
                    await asyncio.wait_for(asyncio.shield(task), timeout=.5)
                except asyncio.TimeoutError:
                    if not waiting:
                        spent += time.monotonic() - tick
                    if spent >= getattr(task, '_ha3d_execution_timeout', 300) or time.monotonic()-started >= 1790:
                        raise
            text = task.result()
            return web.json_response({'choices':[{'message':{'role':'assistant','content':text}}], 'ha3d':self.identity()})
        except asyncio.TimeoutError:
            return web.json_response({'error':'Telegram turn still running; check the bot before retrying'}, status=504)
        except Exception as error:
            safe_reason = str(error) if str(error) in ('Turn was not completed; execution status unknown', 'Agent returned no final text; execution status unknown', 'Telegram turn failed; execution status unknown') else type(error).__name__
            logging.getLogger(__name__).warning('3D Home bridge turn failed: %s', safe_reason)
            return web.json_response({'error':'Telegram turn failed; check the bot and device state before retrying'}, status=502)


def register(ctx):
    ctx.register_platform(name='ha3d_bridge', label='3D Home Telegram Bridge',
        adapter_factory=TelegramBridge, check_fn=lambda:True,
        required_env=['HA3D_BRIDGE_KEY','HA3D_TG_CHAT_ID','HA3D_TG_USER_ID'])
