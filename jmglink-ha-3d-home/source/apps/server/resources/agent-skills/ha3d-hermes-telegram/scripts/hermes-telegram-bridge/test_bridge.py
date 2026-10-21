"""Run in the Hermes venv after plugin registration; all Telegram/agent IO is fake."""
import asyncio
import json
import unittest
import os
import importlib.util
from types import SimpleNamespace
from hermes_cli.plugins import discover_plugins
from gateway.platform_registry import platform_registry
from gateway.config import Platform, PlatformConfig
from gateway.session import build_session_key

discover_plugins()
Bridge = platform_registry.get('ha3d_bridge').adapter_factory
if os.getenv('HA3D_BRIDGE_TEST_FILE'):
    spec=importlib.util.spec_from_file_location('ha3d_bridge_candidate', os.environ['HA3D_BRIDGE_TEST_FILE'])
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    Bridge=module.TelegramBridge

class Request:
    def __init__(self, text='打开客厅灯', request_id='test_request_0123456789', authorized=True):
        self.headers={'Authorization':'Bearer '+'k'*40} if authorized else {}
        self.body={'messages':[{'role':'user','content':text}], 'request_id':request_id, 'stream':False}
    async def json(self): return self.body

class FakeTelegram:
    def __init__(self):
        self.config=SimpleNamespace(extra={}); self._active_sessions={}; self._session_tasks={}; self.sent=[]; self.calls=[];self.streamed=False
        async def execute(event):
            self.calls.append(event.source)
            await asyncio.sleep(.01)
            if self.streamed:
                await self.send(event.source.chat_id,'测试回复')
                return {'final_response':'测试回复','already_sent':True}
            return '测试回复'
        self._message_handler=execute
    def set_message_handler(self, handler): self._message_handler=handler
    async def send(self, chat_id, text, metadata=None):
        self.sent.append((chat_id,text));return SimpleNamespace(success=True)
    async def send_clarify(self, **kwargs):
        return SimpleNamespace(success=True)
    async def handle_message(self, event):
        key=build_session_key(event.source)
        async def work():
            text=await self._message_handler(event)
            if text is not None:
                if not isinstance(text, str): raise TypeError('Native adapter requires text, not dict')
                await self.send(event.source.chat_id,text)
        self._session_tasks[key]=asyncio.create_task(work())
    def _unwrap_ephemeral(self, result): return result,None

class BridgeTests(unittest.IsolatedAsyncioTestCase):
    def fixture(self):
        bridge=Bridge(PlatformConfig(enabled=True)); bridge.key='k'*40; bridge.chat_id='12345';bridge.user_id='12345';bridge.thread_id=None
        tg=FakeTelegram()
        class Owner:
            adapters={Platform.TELEGRAM:tg}
            async def message(self,event): pass
        bridge.set_message_handler(Owner().message)
        return bridge,tg
    async def test_same_telegram_session_and_both_transcripts(self):
        bridge,tg=self.fixture()
        a=await bridge.chat(Request());self.assertEqual(a.status,200)
        self.assertEqual(tg.calls[0].platform,Platform.TELEGRAM)
        self.assertEqual(build_session_key(tg.calls[0]),build_session_key(bridge.source()))
        self.assertEqual(len(tg.sent),2)
        self.assertIn('来自 3D Home',tg.sent[0][1]);self.assertEqual(tg.sent[1][1],'测试回复')
        b=await bridge.chat(Request());self.assertEqual(b.status,200);self.assertEqual(len(tg.calls),1)
        self.assertEqual((await bridge.chat(Request('另一个'))).status,409)
    async def test_denied_key_and_slash_commands_never_execute(self):
        bridge,tg=self.fixture()
        self.assertEqual((await bridge.chat(Request(authorized=False))).status,401)
        self.assertEqual((await bridge.chat(Request('/restart'))).status,400)
        self.assertEqual(tg.calls,[])
    async def test_existing_telegram_busy_never_mirrors_or_interrupts(self):
        bridge,tg=self.fixture();tg._active_sessions[build_session_key(bridge.source())]=True
        self.assertEqual((await bridge.chat(Request())).status,409)
        self.assertEqual(tg.calls,[]);self.assertEqual(tg.sent,[])
    async def test_model_probe_never_sends_messages(self):
        bridge,tg=self.fixture(); response=await bridge.models(Request())
        self.assertEqual(response.status,200)
        self.assertEqual(json.loads(response.text)['ha3d']['mode'],'telegram_shared')
        self.assertEqual(tg.sent,[])
    async def test_streamed_final_is_returned_to_web_without_second_tg_reply(self):
        bridge,tg=self.fixture();tg.streamed=True
        response=await bridge.chat(Request())
        self.assertEqual(response.status,200)
        self.assertEqual(json.loads(response.text)['choices'][0]['message']['content'],'测试回复')
        self.assertEqual(len(tg.sent),2)
    async def test_native_stream_returns_none_and_final_is_read_from_same_transcript(self):
        bridge,tg=self.fixture()
        class Store:
            rows=[{'role':'assistant','content':'旧回复'}]
            def get_or_create_session(self,source): return SimpleNamespace(session_id='existing-tg-session')
            def load_transcript(self,session_id): return self.rows.copy()
        store=Store()
        class NativeOwner:
            session_store=store
            async def message(self,event):
                store.rows += [{'role':'user','content':event.text},{'role':'assistant','content':'流式最终回复'}]
                await tg.send(event.source.chat_id,'流式最终回复')
                return None
        tg._message_handler=NativeOwner().message
        response=await bridge.chat(Request())
        self.assertEqual(response.status,200)
        self.assertEqual(json.loads(response.text)['choices'][0]['message']['content'],'流式最终回复')
        self.assertEqual(len(tg.sent),2)

    async def test_clarification_visible_answer_resumes_same_turn_once(self):
        from tools import clarify_gateway as cg
        bridge,tg=self.fixture()
        session=build_session_key(bridge.source())
        cid='test-choice-1'
        async def run(event):
            tg.calls.append(event.source)
            entry=cg.register(cid,session,'请选择范围',['全屋','客厅'])
            await tg.send_clarify(chat_id=bridge.chat_id,question='请选择范围',choices=['全屋','客厅'],clarify_id=cid,session_key=session)
            while not entry.event.is_set(): await asyncio.sleep(.001)
            response=entry.response
            cg.clear_session(session)
            return '选择结果：'+response
        tg._message_handler=run
        command=asyncio.create_task(bridge.chat(Request()))
        for _ in range(100):
            if bridge.jobs and next(iter(bridge.jobs.values())).get('clarification'): break
            await asyncio.sleep(.001)
        req=Request();req.match_info={'request_id':req.body['request_id']}
        progress=json.loads((await bridge.progress(req)).text)
        self.assertEqual(progress['state'],'waiting_for_input')
        self.assertEqual(progress['clarification']['choices'],['全屋','客厅'])
        req.body={'clarificationId':cid,'answer':'客厅'}
        self.assertEqual((await bridge.answer(req)).status,200)
        self.assertFalse(cg.resolve_gateway_clarify(cid, "全屋"))
        self.assertEqual((await bridge.answer(req)).status,409)
        response=await command
        self.assertEqual(json.loads(response.text)['choices'][0]['message']['content'],'选择结果：客厅')
        self.assertEqual(len(tg.calls),1)
        self.assertEqual(json.loads((await bridge.progress(req)).text)['state'],'completed')

    async def test_tg_answer_expires_browser_choice_without_second_turn(self):
        from tools import clarify_gateway as cg
        bridge,tg=self.fixture(); session=build_session_key(bridge.source())
        task=asyncio.create_task(asyncio.sleep(.1))
        entry=cg.register('tg-first',session,'选哪个',['A','B'])
        bridge.jobs['test_request_0123456789']={'task':task,'session_key':session,'clarification':{'id':'tg-first','question':'选哪个','choices':['A','B']}}
        cg.resolve_gateway_clarify('tg-first','A')
        req=Request();req.match_info={'request_id':req.body['request_id']};req.body={'clarificationId':'tg-first','answer':'B'}
        self.assertEqual((await bridge.answer(req)).status,409)
        self.assertIsNone(json.loads((await bridge.progress(req)).text)['clarification'])
        self.assertEqual(entry.response,'A');self.assertEqual(tg.calls,[])
        task.cancel();cg.clear_session(session)

if __name__=='__main__': unittest.main()
