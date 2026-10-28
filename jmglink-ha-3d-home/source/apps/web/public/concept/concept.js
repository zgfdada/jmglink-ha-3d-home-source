/* Standalone concept demo. No Home Assistant connections or device commands. */
(() => {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {"theme":"gallery"} /*EDITMODE-END*/;
  const themes = {
    orbit: "01 / 深空蓝图",
    gallery: "02 / 建筑画廊",
    signal: "03 / 自由信号",
  };
  const rooms = {
    living: {
      name: "客厅",
      brightness: 72,
      on: true,
      description: "把常用的灯光和空间状态，放在一眼就能找到的位置。",
    },
    bedroom: {
      name: "卧室",
      brightness: 28,
      on: true,
      description: "为休息组织自己的控制面板，让每一次操作更从容。",
    },
    studio: {
      name: "书房",
      brightness: 88,
      on: true,
      description: "让工作照明与空间状态，在自己的界面里各得其所。",
    },
  };
  let selectedRoom = "living";
  let flatView = false;
  const find = (selector) => document.querySelector(selector);
  const all = (selector) => document.querySelectorAll(selector);
  const storageKey = "ha3d-concept-v1";
  function persist() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          theme: document.documentElement.dataset.theme,
          selectedRoom,
          flatView,
          rooms,
        }),
      );
    } catch {
      /* Private/file browsing may disable storage. */
    }
  }
  function applyTheme(theme) {
    const valid = Object.hasOwn(themes, theme) ? theme : TWEAK_DEFAULTS.theme;
    document.documentElement.dataset.theme = valid;
    find("#current-style").textContent = themes[valid];
    all("[data-theme-choice]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.themeChoice === valid),
      ),
    );
    find('meta[name="theme-color"]').content = {
      orbit: "#0b1019",
      gallery: "#f6f5f0",
      signal: "#11130e",
    }[valid];
  }
  window.addEventListener("concept-room-pick", (event) => {
    if (!Object.hasOwn(rooms, event.detail)) return;
    selectedRoom = event.detail; render(); persist();
  });
  function render() {
    const current = rooms[selectedRoom];
    find("#space-status").textContent =
      `${current.name} · 灯光已${current.on ? "开启" : "关闭"}`;
    find("#light-toggle").setAttribute("aria-pressed", String(current.on));
    all("[data-select-room]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.selectRoom === selectedRoom),
      ),
    );
    all(".room").forEach((room) => {
      room.classList.toggle("active", room.dataset.room === selectedRoom);
      room.classList.toggle("off", !rooms[room.dataset.room].on);
    });
    window.dispatchEvent(new CustomEvent("concept-scene-state", { detail: { selectedRoom, flatView, rooms } }));
    window.conceptSceneState = { selectedRoom, flatView, rooms };
    find("#view-toggle").setAttribute("aria-pressed", String(flatView));
    find("#view-toggle").textContent = flatView ? "空间视角" : "平面视角";
  }
  function showTweaks(show = true) {
    find("#style-options").hidden = !show;
    find("#style-trigger").setAttribute("aria-expanded", String(show));
    find("#style-trigger b").textContent = show ? "−" : "＋";
  }
  // Register edit-mode listeners before announcing availability.
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent && event.source !== window) return;
    if (event.data?.type === "__activate_edit_mode") showTweaks();
    if (event.data?.type === "__deactivate_edit_mode") showTweaks(false);
  });
  window.parent.postMessage({ type: "__edit_mode_available" }, "*");
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved) {
      if (Object.hasOwn(rooms, saved.selectedRoom))
        selectedRoom = saved.selectedRoom;
      flatView = saved.flatView === true;
      Object.keys(rooms).forEach((key) => {
        const room = saved.rooms?.[key];
        if (
          room &&
          typeof room.on === "boolean" &&
          Number.isFinite(room.brightness)
        ) {
          rooms[key].on = room.on;
          rooms[key].brightness = Math.min(100, Math.max(1, room.brightness));
        }
      });
      applyTheme(saved.theme);
    } else applyTheme(TWEAK_DEFAULTS.theme);
  } catch {
    applyTheme(TWEAK_DEFAULTS.theme);
  }
  all("[data-select-room]").forEach((button) =>
    button.addEventListener("click", () => {
      selectedRoom = button.dataset.selectRoom;
      render();
      persist();
    }),
  );
  all("[data-theme-choice]").forEach((button) =>
    button.addEventListener("click", () => {
      applyTheme(button.dataset.themeChoice);
      persist();
    }),
  );
  function toggleLight() {
    rooms[selectedRoom].on = !rooms[selectedRoom].on;
    render();
    persist();
  }
  find("#light-toggle").addEventListener("click", toggleLight);
  find("#view-toggle").addEventListener("click", () => {
    flatView = !flatView;
    render();
    persist();
  });
  find("#style-trigger").addEventListener("click", () =>
    showTweaks(find("#style-options").hidden),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") showTweaks(false);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".style-switcher")) showTweaks(false);
  });
  try {
    if (localStorage.getItem('ha3d-concept-white-v1') !== 'yes') {
      applyTheme('gallery'); localStorage.setItem('ha3d-concept-white-v1','yes'); persist();
    }
  } catch { applyTheme('gallery'); }
  render();
})();
