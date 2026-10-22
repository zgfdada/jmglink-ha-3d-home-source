// Songloft 2.1.1: synchronized with Hass-Frontend-Cards/songloft-card; includes sandbox search and lyric scrolling fixes.
const CARD_VERSION = "2.1.1";

const FEATURES = {
  PAUSE: 1, SEEK: 2, VOLUME_SET: 4, VOLUME_MUTE: 8,
  PREVIOUS: 16, NEXT: 32, PLAY_MEDIA: 512, SELECT_SOURCE: 2048, PLAY: 16384,
};
const PLAY_MODES = [
  ["order", "顺序播放", "mdi:playlist-play"],
  ["loop", "列表循环", "mdi:repeat"],
  ["single", "单曲循环", "mdi:repeat-once"],
  ["random", "随机播放", "mdi:shuffle-variant"],
  ["singlePlay", "单曲播放", "mdi:numeric-1-box-outline"],
];

class SongloftCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = undefined;
    this._hass = undefined;
    this._expanded = false;
    this._panel = "lyrics";
    this._scope = "song";
    this._query = "";
    this._playlistQuery = "";
    this._pending = new Set();
    this._draggingSeek = false;
    this._draggingVolume = false;
    this._lyricOffset = this._loadOffset();
    this._lyrics = [];
    this._translation = new Map();
    this._lyricsSignature = "";
    this._activeLyric = -1;
    this._frame = 0;
    this._lastFrameAt = 0;
    this._renderedSignature = "";
    for (const type of ["click", "input", "change", "submit", "keydown"]) {
      this.shadowRoot.addEventListener(type, (event) => this[`_on${type[0].toUpperCase()}${type.slice(1)}`](event));
    }
  }

  static getStubConfig() {
    return { entity: "media_player.songloft", title: "Songloft", default_expanded: false, compact: false };
  }

  getGridOptions() { return { columns: "full", min_columns: 6, rows: "auto" }; }

  setConfig(config) {
    if (!config?.entity?.startsWith("media_player.")) throw new Error("Songloft Card requires a media_player entity.");
    this._config = {
      title: "Songloft", default_expanded: false, compact: false,
      show_lyrics: true, show_search: true, show_playlists: true, ...config,
    };
    this._expanded = Boolean(this._config.default_expanded);
    if (!this._config.show_lyrics) this._panel = this._config.show_search ? "search" : "playlists";
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._prepareLyrics();
    const signature = this._stateSignature();
    if (signature !== this._renderedSignature) this._render();
    else this._updateLive();
    this._startLoop();
  }

  connectedCallback() { this._startLoop(); this._render(); }
  disconnectedCallback() { cancelAnimationFrame(this._frame); this._frame = 0; }
  getCardSize() { return this._expanded ? 9 : 2; }
  _entity() { return this._hass?.states?.[this._config?.entity]; }
  _has(feature) { return Boolean(Number(this._entity()?.attributes?.supported_features || 0) & feature); }

  _stateSignature() {
    const entity = this._entity();
    if (!entity) return "missing";
    const a = entity.attributes || {};
    return JSON.stringify({
      state: entity.state,
      title: a.media_title,
      artist: a.media_artist,
      album: a.media_album_name,
      picture: a.entity_picture,
      duration: a.media_duration,
      volume: a.volume_level,
      muted: a.is_volume_muted,
      features: a.supported_features,
      source: a.source,
      songId: a.songloft_song_id,
      mode: a.songloft_play_mode,
      favorite: a.is_favorite,
      lyrics: this._lyricsSignature,
      playlists: a.songloft_playlists,
      queue: a.songloft_play_queue,
      currentIndex: a.songloft_current_index,
      results: a.search_results,
    });
  }

  _prepareLyrics() {
    const a = this._entity()?.attributes || {};
    const main = typeof a.lyrics === "string" ? a.lyrics : "";
    const translated = typeof a.translated_lyrics === "string" ? a.translated_lyrics : "";
    const signature = `${a.songloft_song_id || ""}:${main.length}:${translated.length}:${main.slice(0, 40)}`;
    if (signature === this._lyricsSignature) return;
    this._lyricsSignature = signature;
    this._lyrics = this._parseLrc(main);
    this._translation = new Map(this._parseLrc(translated).map((line) => [Math.round(line.time * 10), line.text]));
    this._activeLyric = -1;
  }

  _parseLrc(raw) {
    if (!raw) return [];
    const output = [];
    for (const row of raw.split(/\r?\n/)) {
      if (/^\[(ti|ar|al|by|offset):/i.test(row)) continue;
      const regex = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
      const matches = [...row.matchAll(regex)];
      const text = row.replace(regex, "").trim();
      if (!text) continue;
      for (const match of matches) {
        const fraction = match[3] ? Number(match[3]) / (match[3].length === 3 ? 1000 : 100) : 0;
        output.push({ time: Number(match[1]) * 60 + Number(match[2]) + fraction, text });
      }
    }
    return output.sort((a, b) => a.time - b.time);
  }

  _position() {
    const entity = this._entity();
    const a = entity?.attributes || {};
    let value = Number(a.media_position);
    if (!Number.isFinite(value)) return 0;
    if (entity.state === "playing" && a.media_position_updated_at) {
      const updated = Date.parse(a.media_position_updated_at);
      if (Number.isFinite(updated)) value += Math.max(0, (Date.now() - updated) / 1000);
    }
    const duration = Number(a.media_duration);
    return Math.max(0, Number.isFinite(duration) ? Math.min(duration, value) : value);
  }

  _startLoop() {
    if (this._frame || !this.isConnected) return;
    const tick = (now) => {
      if (now - this._lastFrameAt >= 100) { this._lastFrameAt = now; this._updateLive(); }
      this._frame = requestAnimationFrame(tick);
    };
    this._frame = requestAnimationFrame(tick);
  }

  _updateLive() {
    const position = this._position();
    const progress = this.shadowRoot.querySelector("#sl-seek");
    if (progress && !this._draggingSeek) progress.value = String(position);
    const time = this.shadowRoot.querySelector("#sl-current-time");
    if (time && !this._draggingSeek) time.textContent = this._formatTime(position);
    if (!this._expanded || this._panel !== "lyrics" || !this._lyrics.length) return;
    const lyricTime = position + this._lyricOffset;
    let index = -1;
    for (let i = 0; i < this._lyrics.length; i += 1) if (this._lyrics[i].time <= lyricTime) index = i;
    if (index === this._activeLyric) return;
    this._activeLyric = index;
    const lines = [...this.shadowRoot.querySelectorAll(".lyric-line")];
    lines.forEach((line, i) => {
      line.classList.toggle("current", i === index);
      line.classList.toggle("near", Math.abs(i - index) <= 2);
    });
    const target = lines[Math.max(0, index)];
    const container = this.shadowRoot.querySelector(".lyrics");
    if (target && container) {
      const row = target.getBoundingClientRect();
      const viewport = container.getBoundingClientRect();
      const top = container.scrollTop + row.top - viewport.top - container.clientTop - (container.clientHeight - row.height) / 2;
      container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }

  _render() {
    if (!this._config || !this.shadowRoot) return;
    const focus = this._captureFocus();
    const entity = this._entity();
    if (!entity) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card class="missing">未找到 ${this._esc(this._config.entity)}</ha-card>`;
      this._renderedSignature = "missing";
      return;
    }
    const a = entity.attributes || {};
    const unavailable = ["unknown", "unavailable"].includes(entity.state);
    const playing = entity.state === "playing";
    const title = a.media_title || "暂无播放内容";
    const artist = [a.media_artist, a.media_album_name].filter(Boolean).join(" · ") || "Songloft 音乐服务器";
    const picture = a.entity_picture ? this._hass.hassUrl(a.entity_picture) : "";
    const duration = Number(a.media_duration);
    const volume = Number.isFinite(Number(a.volume_level)) ? Number(a.volume_level) : 0;
    const playlists = Array.isArray(a.songloft_playlists) ? a.songloft_playlists : [];
    const playQueue = Array.isArray(a.songloft_play_queue) ? a.songloft_play_queue : [];
    const results = Array.isArray(a.search_results) ? a.search_results : [];
    const mode = PLAY_MODES.find(([value]) => value === a.songloft_play_mode) || PLAY_MODES[0];
    const collapsed = this._expanded ? "" : " collapsed";
    const compact = this._config.compact ? " compact" : "";
    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card class="songloft${collapsed}${compact}">
        <div class="ambient"></div>
        <header>
          <div class="brand"><ha-icon icon="mdi:disc-player"></ha-icon><span>${this._esc(this._config.title)}</span></div>
          <div class="device"><span></span>${this._esc(a.friendly_name || "Songloft")}</div>
          <button class="icon expand" data-action="expand" aria-label="${this._expanded ? "收起" : "展开"}"><ha-icon icon="mdi:chevron-${this._expanded ? "up" : "down"}"></ha-icon></button>
        </header>
        ${this._error ? `<p role="alert" style="padding:10px;color:var(--error-color,#c33)">${this._esc(this._error)}</p>` : ""}
        <main>
          <section class="player">
            <div class="art">${picture ? `<img src="${this._esc(picture)}" alt="${this._esc(title)}">` : '<ha-icon icon="mdi:music-note"></ha-icon>'}</div>
            <div class="meta"><div class="song-title">${this._esc(title)}</div><div class="artist">${this._esc(artist)}</div></div>
            <div class="progress">
              <input id="sl-seek" type="range" min="0" max="${Number.isFinite(duration) && duration > 0 ? duration : 1}" value="${this._position()}" ${this._has(FEATURES.SEEK) && !unavailable ? "" : "disabled"} aria-label="播放进度">
              <div class="times"><span id="sl-current-time">${this._formatTime(this._position())}</span><span>${this._formatTime(duration)}</span></div>
            </div>
            <div class="transport">
              ${this._button("previous", "mdi:skip-previous", "上一首", this._has(FEATURES.PREVIOUS), unavailable)}
              ${this._button(playing ? "pause" : "play", playing ? "mdi:pause" : "mdi:play", playing ? "暂停" : "播放", this._has(playing ? FEATURES.PAUSE : FEATURES.PLAY), unavailable, true)}
              ${this._button("next", "mdi:skip-next", "下一首", this._has(FEATURES.NEXT), unavailable)}
              ${this._button("favorite", a.is_favorite ? "mdi:heart" : "mdi:heart-outline", a.is_favorite ? "取消收藏" : "收藏", Boolean(a.songloft_song_id), unavailable)}
            </div>
            <div class="settings">
              <label class="setting"><ha-icon icon="${a.is_volume_muted ? "mdi:volume-off" : "mdi:volume-high"}"></ha-icon><input id="sl-volume" type="range" min="0" max="1" step="0.01" value="${volume}" ${this._has(FEATURES.VOLUME_SET) && !unavailable ? "" : "disabled"} aria-label="音量"><span id="sl-volume-value">${Math.round(volume * 100)}%</span></label>
              <button class="setting mode" data-action="mode" data-mode="${mode[0]}" ${unavailable ? "disabled" : ""}><ha-icon icon="${mode[2]}"></ha-icon><span>${mode[1]}</span></button>
            </div>
          </section>
          ${this._expanded ? `<section class="content">
            <nav>${this._config.show_lyrics ? this._tab("lyrics", "歌词") : ""}${this._config.show_search ? this._tab("search", "搜索") : ""}${this._config.show_playlists ? this._tab("playlists", "歌单") : ""}${this._tab("queue", "播放列表")}</nav>
            ${this._panel === "lyrics" ? this._lyricsView() : this._panel === "search" ? this._searchView(results, playlists, unavailable) : this._panel === "playlists" ? this._playlistsView(playlists, unavailable) : this._queueView(playQueue, a.songloft_current_index, a.source, unavailable)}
          </section>` : ""}
        </main>
      </ha-card>`;
    this._renderedSignature = this._stateSignature();
    this._activeLyric = -1;
    this._restoreFocus(focus);
    this._updateLive();
  }

  _captureFocus() {
    const active = this.shadowRoot.activeElement;
    if (!(active instanceof HTMLInputElement) || !active.id) return undefined;
    return { id: active.id, start: active.selectionStart, end: active.selectionEnd };
  }

  _restoreFocus(saved) {
    if (!saved) return;
    const input = this.shadowRoot.getElementById(saved.id);
    if (!(input instanceof HTMLInputElement)) return;
    input.focus({ preventScroll: true });
    if (saved.start !== null && saved.end !== null) input.setSelectionRange(saved.start, saved.end);
  }

  _button(action, icon, label, supported, unavailable, primary = false) {
    if (!supported) return "";
    return `<button class="icon${primary ? " primary" : ""}" data-action="${action}" aria-label="${label}" ${unavailable || this._pending.has(action) ? "disabled" : ""}><ha-icon icon="${this._pending.has(action) ? "mdi:loading" : icon}"></ha-icon></button>`;
  }
  _tab(panel, label) { return `<button data-action="panel" data-panel="${panel}" aria-selected="${this._panel === panel}">${label}</button>`; }

  _lyricsView() {
    const lines = this._lyrics.length ? this._lyrics.map((line, i) => {
      const translated = this._translation.get(Math.round(line.time * 10));
      return `<button class="lyric-line" data-action="lyric" data-time="${line.time}" data-index="${i}"><span>${this._esc(line.text)}</span>${translated ? `<small>${this._esc(translated)}</small>` : ""}</button>`;
    }).join("") : '<div class="empty">当前歌曲暂无时间轴歌词</div>';
    return `<div class="lyrics-tools"><span>实时歌词</span><button data-action="offset" data-delta="-0.5">−0.5s</button><button data-action="offset-reset">${this._lyricOffset > 0 ? "+" : ""}${this._lyricOffset.toFixed(1)}s</button><button data-action="offset" data-delta="0.5">+0.5s</button></div><div class="lyrics">${lines}</div>`;
  }

  _searchView(results, playlists, unavailable) {
    const items = this._scope === "song" ? results : this._filterPlaylists(playlists, this._query);
    return `<div class="search"><input id="sl-search" value="${this._esc(this._query)}" placeholder="搜索歌曲或歌单" aria-label="搜索歌曲或歌单"><button type="button" data-action="search" ${unavailable || this._pending.has("search") ? "disabled" : ""}><ha-icon icon="mdi:magnify"></ha-icon>搜索</button></div><div class="scopes"><button type="button" data-action="scope" data-scope="song" aria-pressed="${this._scope === "song"}">歌曲</button><button type="button" data-action="scope" data-scope="playlist" aria-pressed="${this._scope === "playlist"}">歌单</button></div>${this._pending.has("search") ? '<div class="empty" role="status">正在搜索…</div>' : this._resultList(items, this._scope, unavailable)}`;
  }

  _playlistsView(playlists, unavailable) {
    const filtered = this._filterPlaylists(playlists, this._playlistQuery);
    return `<div class="playlist-search"><ha-icon icon="mdi:magnify"></ha-icon><input id="sl-playlist-search" value="${this._esc(this._playlistQuery)}" placeholder="筛选 ${playlists.length} 个歌单" aria-label="筛选歌单"></div>${this._resultList(filtered, "playlist", unavailable)}`;
  }
  _queueView(items, currentIndex, source, unavailable) {
    const title = source ? `${source} · ${items.length} 首` : `当前播放列表 · ${items.length} 首`;
    const hasCurrentIndex = currentIndex !== null && currentIndex !== undefined && Number.isInteger(Number(currentIndex));
    if (!items.length) return `<div class="queue-heading">${this._esc(title)}</div><div class="empty">当前没有可显示的播放列表</div>`;
    return `<div class="queue-heading">${this._esc(title)}</div><div class="results queue">${items.map((item, index) => {
      const current = hasCurrentIndex && Number(item.index ?? index) === Number(currentIndex);
      const sub = [item.artist, item.album, this._formatTime(Number(item.duration))].filter((value) => value && value !== "—:—").join(" · ");
      return `<button class="result${current ? " current" : ""}" data-action="result" data-type="song" data-id="${this._esc(item.id)}" ${unavailable || !this._has(FEATURES.PLAY_MEDIA) ? "disabled" : ""}><span class="queue-index">${current ? '<ha-icon icon="mdi:volume-high"></ha-icon>' : Number(item.index ?? index) + 1}</span><span class="copy"><span>${this._esc(item.title || "未命名歌曲")}</span><small>${this._esc(sub || "未知")}</small></span><ha-icon icon="mdi:play"></ha-icon></button>`;
    }).join("")}</div>`;
  }
  _filterPlaylists(items, query) { const q = query.trim().toLocaleLowerCase(); return items.filter((item) => !q || String(item.name || "").toLocaleLowerCase().includes(q)); }
  _resultList(items, type, unavailable) {
    if (!items.length) return '<div class="empty">没有匹配结果</div>';
    return `<div class="results">${items.map((item) => {
      const title = type === "song" ? item.title : item.name;
      const sub = type === "song" ? [item.artist, item.album].filter(Boolean).join(" · ") : `${item.song_count ?? "—"} 首歌曲`;
      const disabled = unavailable || (type === "song" ? !this._has(FEATURES.PLAY_MEDIA) : !this._has(FEATURES.SELECT_SOURCE));
      return `<button class="result" data-action="result" data-type="${type}" data-id="${this._esc(item.id)}" data-name="${this._esc(item.name || "")}" ${disabled ? "disabled" : ""}><span class="thumb"><ha-icon icon="mdi:${type === "song" ? "music-note" : "playlist-music"}"></ha-icon></span><span class="copy"><span>${this._esc(title || "未命名")}</span><small>${this._esc(sub || "未知")}</small></span><ha-icon icon="mdi:play"></ha-icon></button>`;
    }).join("")}</div>`;
  }

  _styles() { return `<style>
    :host{display:block;width:100%;container-type:inline-size;--sl-accent:var(--accent-color,#4285f4)}*{box-sizing:border-box}.missing{padding:18px;color:var(--error-color)}
    ha-card.songloft{position:relative;overflow:hidden;color:var(--primary-text-color)}.ambient{position:absolute;inset:-40% 45% 55% -20%;background:radial-gradient(circle,var(--sl-accent),transparent 68%);filter:blur(60px);opacity:.13;pointer-events:none}
    header{position:relative;display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid var(--divider-color)}.brand{display:flex;align-items:center;gap:7px;font-weight:500}.brand ha-icon{color:var(--sl-accent)}.device{display:flex;align-items:center;margin-left:auto;color:var(--secondary-text-color);font-size:12px}.device>span{width:7px;height:7px;margin-right:5px;border-radius:50%;background:var(--sl-accent)}
    button{font:inherit;color:inherit;cursor:pointer}button:disabled{opacity:.35;cursor:not-allowed}.icon{display:inline-grid;place-items:center;width:42px;height:42px;border:0;border-radius:50%;background:transparent}.icon:hover{background:var(--secondary-background-color)}.icon.primary{width:52px;height:52px;background:var(--sl-accent);color:var(--text-primary-color,#fff)}
    main{position:relative;display:grid;grid-template-columns:minmax(250px,340px) minmax(0,1fr)}.player{padding:21px;border-right:1px solid var(--divider-color)}.art{display:grid;place-items:center;width:min(100%,296px);aspect-ratio:1;margin:auto;overflow:hidden;border-radius:17px;background:var(--secondary-background-color);color:var(--sl-accent)}.art img{width:100%;height:100%;object-fit:cover}.art>ha-icon{width:35%;height:35%}
    .meta{text-align:center;margin-top:15px}.song-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:18px;font-weight:500}.artist{margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--secondary-text-color);font-size:13px}.progress{margin-top:13px}input[type=range]{width:100%;accent-color:var(--sl-accent)}.times{display:flex;justify-content:space-between;color:var(--secondary-text-color);font-size:11px;font-variant-numeric:tabular-nums}.transport{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:10px}
    .settings{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px;margin-top:13px}.setting{display:flex;align-items:center;gap:7px;min-width:0;min-height:43px;padding:7px 9px;border:1px solid var(--divider-color);border-radius:11px;background:var(--secondary-background-color)}.setting ha-icon{width:19px;height:19px;color:var(--secondary-text-color)}.setting input{min-width:0}.setting>span:last-child{font-size:12px;white-space:nowrap}.mode{width:100%;text-align:left}.mode span{overflow:hidden;text-overflow:ellipsis}
    .content{min-width:0;padding:16px}.content nav{display:flex;gap:3px;padding:3px;border-radius:10px;background:var(--secondary-background-color)}.content nav button{flex:1;min-height:36px;border:0;border-radius:8px;background:transparent;color:var(--secondary-text-color)}.content nav button[aria-selected=true]{background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--ha-card-box-shadow)}
    .lyrics-tools{display:flex;align-items:center;gap:6px;margin-top:11px;color:var(--secondary-text-color);font-size:12px}.lyrics-tools>span{margin-right:auto}.lyrics-tools button,.scopes button{padding:5px 9px;border:1px solid var(--divider-color);border-radius:999px;background:transparent}.lyrics{height:400px;margin-top:4px;overflow-y:auto;scrollbar-width:none;mask-image:linear-gradient(to bottom,transparent,#000 14%,#000 86%,transparent);padding-block:170px}.lyric-line{display:block;width:100%;padding:8px 4px;border:0;background:transparent;color:var(--secondary-text-color);text-align:center;opacity:.55;transition:.3s}.lyric-line.near{opacity:.78}.lyric-line.current{color:var(--sl-accent);font-weight:500;opacity:1;transform:scale(1.05)}.lyric-line span,.lyric-line small{display:block}.lyric-line small{margin-top:4px;font-size:12px;opacity:.72}
    .search{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:14px}.search input,.playlist-search input{min-width:0;height:42px;padding:0 11px;border:1px solid var(--divider-color);border-radius:10px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}.search button{display:flex;align-items:center;gap:5px;padding:0 14px;border:0;border-radius:10px;background:var(--sl-accent);color:var(--text-primary-color,#fff)}.scopes{display:flex;gap:7px;margin-top:9px}.scopes button{color:var(--secondary-text-color)}.scopes button[aria-pressed=true]{border-color:var(--sl-accent);color:var(--sl-accent)}
    .playlist-search{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:7px;margin-top:14px}.playlist-search input{width:100%}.queue-heading{margin-top:14px;color:var(--secondary-text-color);font-size:12px}.results{margin-top:10px;max-height:410px;overflow-y:auto}.result{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:9px;width:100%;padding:8px 3px;border:0;border-bottom:1px solid var(--divider-color);background:transparent;text-align:left}.result.current{background:color-mix(in srgb,var(--sl-accent) 9%,transparent);color:var(--sl-accent)}.thumb{display:grid;place-items:center;width:40px;height:40px;border-radius:9px;background:var(--secondary-background-color);color:var(--sl-accent)}.queue-index{display:grid;place-items:center;width:40px;color:var(--secondary-text-color);font-size:12px;font-variant-numeric:tabular-nums}.queue-index ha-icon{width:18px;height:18px;color:var(--sl-accent)}.copy{min-width:0}.copy>span,.copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.copy small{margin-top:2px;color:var(--secondary-text-color);font-size:12px}.result>ha-icon{color:var(--secondary-text-color)}.empty{padding:70px 10px;color:var(--secondary-text-color);text-align:center}
    .collapsed{max-width:620px}.collapsed main{grid-template-columns:minmax(0,1fr)}.collapsed .player{display:grid;grid-template-columns:62px minmax(0,1fr) auto;align-items:center;gap:11px;padding:13px 16px;border:0}.collapsed .art{width:62px;border-radius:11px}.collapsed .meta{min-width:0;margin:0;text-align:left}.collapsed .song-title{font-size:16px}.collapsed .progress,.collapsed .settings{display:none}.collapsed .transport{margin:0;gap:1px}.collapsed .transport .icon{width:39px;height:39px}.collapsed .transport .primary{width:46px;height:46px}.compact .player{padding:14px}.compact .content{padding:12px}
    @container(max-width:680px){main{grid-template-columns:minmax(0,1fr)}.player{border-right:0;border-bottom:1px solid var(--divider-color)}.art{width:min(74%,290px)}.lyrics{height:330px;padding-block:140px}}
    @container(max-width:420px){header{padding:10px 12px}.device{display:none}.player,.content{padding:13px}.settings{grid-template-columns:minmax(0,1fr)}.search{grid-template-columns:minmax(0,1fr)}.search button{min-height:40px;justify-content:center}.collapsed .player{grid-template-columns:52px minmax(0,1fr)}.collapsed .art{width:52px}.collapsed .transport{grid-column:1/-1}}
  </style>`; }

  _onClick(event) {
    const target = event.target.closest?.("[data-action]"); if (!target || target.disabled) return;
    const action = target.dataset.action;
    if (action === "search") { this._search(); return; }
    if (action === "expand") { this._expanded = !this._expanded; this._render(); return; }
    if (action === "panel") { this._panel = target.dataset.panel; this._render(); return; }
    if (action === "scope") { this._scope = target.dataset.scope; this._render(); return; }
    if (action === "mode") { const index = PLAY_MODES.findIndex(([value]) => value === target.dataset.mode); const next = PLAY_MODES[(index + 1) % PLAY_MODES.length][0]; this._call("mode", "songloft", "set_play_mode", { play_mode: next }); return; }
    if (action === "favorite") { this._call("favorite", "songloft", "toggle_favorite", {}); return; }
    if (action === "lyric") { this._call("seek", "media_player", "media_seek", { seek_position: Number(target.dataset.time) }); return; }
    if (action === "offset") { this._lyricOffset += Number(target.dataset.delta); this._saveOffset(); this._activeLyric = -1; this._render(); return; }
    if (action === "offset-reset") { this._lyricOffset = 0; this._saveOffset(); this._activeLyric = -1; this._render(); return; }
    if (action === "result") {
      if (target.dataset.type === "song") this._call("result", "media_player", "play_media", { media_content_type: "songloft_song", media_content_id: target.dataset.id });
      else this._call("result", "media_player", "select_source", { source: target.dataset.name });
      return;
    }
    const services = { play: "media_play", pause: "media_pause", previous: "media_previous_track", next: "media_next_track" };
    if (services[action]) this._call(action, "media_player", services[action], {});
  }

  _onInput(event) {
    if (event.target.id === "sl-seek") { this._draggingSeek = true; this.shadowRoot.querySelector("#sl-current-time").textContent = this._formatTime(Number(event.target.value)); }
    if (event.target.id === "sl-volume") { this._draggingVolume = true; this.shadowRoot.querySelector("#sl-volume-value").textContent = `${Math.round(Number(event.target.value) * 100)}%`; }
    if (event.target.id === "sl-search") this._query = event.target.value;
    if (event.target.id === "sl-playlist-search") { this._playlistQuery = event.target.value; this._render(); const input = this.shadowRoot.querySelector("#sl-playlist-search"); input?.focus(); input?.setSelectionRange(this._playlistQuery.length, this._playlistQuery.length); }
  }
  _onChange(event) {
    if (event.target.id === "sl-seek") { this._draggingSeek = false; this._call("seek", "media_player", "media_seek", { seek_position: Number(event.target.value) }); }
    if (event.target.id === "sl-volume") { this._draggingVolume = false; this._call("volume", "media_player", "volume_set", { volume_level: Number(event.target.value) }); }
  }
  _search() {
    this._query = this.shadowRoot.querySelector("#sl-search")?.value ?? this._query;
    if (this._scope === "song" && this._query.trim()) return this._call("search", "songloft", "search", { query: this._query.trim(), play_first: false });
    this._render();
  }
  _onKeydown(event) {
    if (event.target.id === "sl-search" && event.key === "Enter" && !event.isComposing) { event.preventDefault(); this._search(); }
  }
  _onSubmit(event) {
    if (!event.target.matches(".search")) return; event.preventDefault();
    this._search();
  }
  async _call(key, domain, service, data) {
    if (!this._hass || this._pending.has(key)) return; this._pending.add(key); this._error = ""; this._render();
    try { await this._hass.callService(domain, service, { entity_id: this._config.entity, ...data }); }
    catch (error) { this._error = `操作失败：${error.message || error}`; console.error(`Songloft Card: ${domain}.${service} failed`, error); }
    finally { this._pending.delete(key); this._render(); }
  }
  _loadOffset() { try { return Number(localStorage.getItem("songloft-card-lyrics-offset")) || 0; } catch { return 0; } }
  _saveOffset() { try { localStorage.setItem("songloft-card-lyrics-offset", String(this._lyricOffset)); } catch { /* storage unavailable */ } }
  _formatTime(value) { if (!Number.isFinite(Number(value))) return "—:—"; const s = Math.max(0, Math.round(Number(value))); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
  _esc(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
}

if (!customElements.get("songloft-card")) customElements.define("songloft-card", SongloftCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "songloft-card", name: "Songloft Music Center", description: "Songloft 实时歌词、搜索和播放控制。", preview: true });
console.info(`%c SONGLOFT-CARD %c v${CARD_VERSION} `, "color:white;background:#4285f4;font-weight:700", "color:#4285f4;background:#fff");
