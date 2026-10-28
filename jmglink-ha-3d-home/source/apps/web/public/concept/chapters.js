(() => {
  const q = (s) => document.querySelector(s);
  const all = (s) => document.querySelectorAll(s);
  const press = (selector, key, value) =>
    all(selector).forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset[key] === value)),
    );
  all("[data-demo-floor]").forEach((b) =>
    b.addEventListener("click", () => {
      const second = b.dataset.demoFloor === "2";
      press("[data-demo-floor]", "demoFloor", b.dataset.demoFloor);
      q(".blueprint-layout").dataset.floor = b.dataset.demoFloor;
      ["a", "b", "c"].forEach(
        (key, i) =>
          (q("#floor-room-" + key).textContent = (
            second
              ? ["主卧 · 衣帽间", "私享书房", "休息区"]
              : ["客厅 · 餐厅", "书房", "厨房"]
          )[i]),
      );
      q("#floor-note").textContent = second
        ? "2F / 休息空间与个人习惯"
        : "1F / 公共空间与日常动线";
    }),
  );
  const sidebarViews = {
    rooms:
      '<p class="sidebar-card-label">房间首页 / 状态与常用操作</p><div class="sidebar-metrics"><div><span>客厅</span><strong>舒适</strong></div><div><span>卧室</span><strong>安静</strong></div><div><span>灯光</span><strong>随心配置</strong></div><div><span>窗帘</span><strong>双层联动</strong></div></div><p class="sidebar-demo-footer">从房间进入设备，把常用的状态与操作安排在自己的位置。</p>',
    music:
      '<p class="sidebar-card-label">音乐中心 / 视觉效果示意，无音频播放</p><div class="music-art" aria-hidden="true">' +
      [65, 110, 145, 95, 130, 160, 100, 70, 125, 90]
        .map((h, i) => `<i style="--bar:${h}px;--delay:-${i * 0.17}s"></i>`)
        .join("") +
      '</div><p class="music-title">让声音，也有自己的界面。</p><p class="music-subtitle">歌词 · 搜索 · 歌单 · 播放列表</p>',
    status:
      '<p class="sidebar-card-label">运维首页 / 示例数值，非真实主机状态</p>' +
      [
        ["主机 CPU", "28%"],
        ["内存使用", "46%"],
        ["耗材剩余", "72%"],
      ]
        .map(
          ([n, v]) =>
            `<div class="status-track"><div><span>${n}</span><span>${v}</span></div><i style="--value:${v}"></i></div>`,
        )
        .join("") +
      '<p class="sidebar-demo-footer">事件、离线与耗材可以独立放置，让需要关注的信息更容易被看见。</p>',
  };
  function sidebar(tab) {
    q("#sidebar-demo-content").innerHTML = sidebarViews[tab];
    all("[data-sidebar-tab]").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.sidebarTab === tab));
      b.tabIndex = b.dataset.sidebarTab === tab ? 0 : -1;
    });
  }
  all("[data-sidebar-tab]").forEach((b) => {
    b.addEventListener("click", () => sidebar(b.dataset.sidebarTab));
    b.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      const tabs = [...all("[data-sidebar-tab]")],
        i = tabs.indexOf(b),
        next = tabs[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3];
      sidebar(next.dataset.sidebarTab);
      next.focus();
    });
  });
  sidebar("rooms");
  function lighting() {
    const present = q("#light-presence").value === "present",
      dim = q("#light-environment").value === "dim",
      night = q("#light-period").value === "night",
      scene = q("#light-scene").value;
    let brightness = 0,
      temp = 2700,
      reason = "环境采光充足，不额外开灯。";
    if (scene === "movie") {
      brightness = 15;
      temp = 2700;
      reason = "电影模式优先：保留低亮暖色氛围光。";
    } else if (scene === "sleep") {
      brightness = 0;
      reason = "睡眠模式优先：关闭主照明。";
    } else if (!present) {
      reason = "持续无人超过示例延时 5 分钟：关闭灯光。";
    } else if (night) {
      brightness = 20;
      temp = 2700;
      reason = "夜间有人：使用低亮暖光。";
    } else if (dim) {
      brightness = 75;
      temp = 4000;
      reason = "白天有人且采光偏暗：开启舒适补光。";
    }
    q("#lighting-output").textContent =
      `${brightness}%\n${brightness ? temp + " K" : "灯光关闭"}`;
    q("#lighting-reason").textContent = reason;
    q("#lighting-result-tag").textContent =
      scene === "auto"
        ? "自动模式"
        : scene === "movie"
          ? "电影优先"
          : "睡眠优先";
    q(".light-room-demo").style.setProperty(
      "--light-opacity",
      brightness / 100,
    );
    q(".light-room-demo").style.setProperty(
      "--light-color",
      temp === 4000 ? "#e5edff" : "#ffd78b",
    );
  }
  all(".lighting-inputs select").forEach((s) =>
    s.addEventListener("change", lighting),
  );
  lighting();
  let phase = "A",
    scene = "auto",
    remaining = 0,
    manual = 100,
    manualSheer = 0;
  function curtain() {
    const progress = Number(q("#curtain-progress").value),
      threshold = q("#curtain-threshold").value;
    let blackout = 100,
      sheer = 0,
      rule = "日出前：打开遮光帘，关闭纱帘。";
    if (phase === "B") {
      sheer = progress;
      rule = `日出前 15 分钟至起床：按时间比例渐开纱帘（示意 ${progress}%），遮光帘保持打开。`;
    }
    if (phase === "C") {
      sheer = 100;
      rule = "起床至起床后 2 小时：两层窗帘全部打开。";
    }
    if (phase === "D") {
      blackout = { low: 75, medium: 50, high: 25 }[threshold];
      sheer = 100;
      rule = `白天阈值 ${{ low: "低", medium: "中", high: "高" }[threshold]}：示例将遮光帘关闭 ${100 - blackout}%，纱帘保持打开。`;
    }
    if (phase === "E") {
      blackout = { low: 75, medium: 50, high: 25 }[threshold];
      rule = "日落后 1 小时：关闭纱帘，遮光帘延续所选白天阈值的示意位置。";
    }
    if (phase === "F") {
      blackout = 100 - progress;
      rule = `睡眠至午夜：按时间比例渐关遮光帘（已关闭 ${progress}%），纱帘保持关闭。`;
    }
    let badge = "自动模式";
    if (remaining > 0) {
      blackout = manual;
      sheer = manualSheer;
      badge = `手动保护 · 剩余 ${remaining} 分钟`;
      rule =
        "手动调整后，暂停时间轴自动控制 1 小时；保护结束后重新按当前时段计算。";
    }
    if (scene !== "auto") {
      blackout = 0;
      sheer = 0;
      badge = { sleep: "睡眠模式", movie: "电影模式", privacy: "极隐私模式" }[
        scene
      ];
      rule = "情景模式优先：两层窗帘全部关闭，时间轴与手动保护暂不接管。";
    }
    q(".curtain-window").style.setProperty("--blackout-open", blackout);
    q(".curtain-window").style.setProperty("--sheer-open", sheer);
    q("#blackout-value").textContent = blackout + "%";
    q("#sheer-value").textContent = sheer + "%";
    q("#curtain-rule").textContent = rule;
    q("#curtain-mode-badge").textContent = badge;
    q("#manual-status").textContent =
      scene !== "auto"
        ? "情景优先，手动暂不可用"
        : remaining > 0
          ? `保护剩余 ${remaining} 分钟`
          : "自动控制中";
    q("#manual-curtain").disabled = scene !== "auto";
    q("#advance-manual").disabled = remaining === 0 || scene !== "auto";
    q("#manual-curtain").value = blackout;
    q("#curtain-scene-note").textContent =
      scene === "sleep"
        ? "睡眠方案：提前关闭全部窗帘，并可联动轻音乐（本页不播放）。"
        : scene === "auto"
          ? "情景模式高于手动保护和自动时间轴。"
          : `${badge}：关闭全部窗帘，退出后按当前保护或时间轴恢复。`;
    press("[data-curtain-phase]", "curtainPhase", phase);
    press("[data-curtain-scene]", "curtainScene", scene);
  }
  all("[data-curtain-phase]").forEach((b) =>
    b.addEventListener("click", () => {
      phase = b.dataset.curtainPhase;
      curtain();
    }),
  );
  all("[data-curtain-scene]").forEach((b) =>
    b.addEventListener("click", () => {
      scene = b.dataset.curtainScene;
      curtain();
    }),
  );
  q("#curtain-progress").addEventListener("input", curtain);
  q("#curtain-threshold").addEventListener("change", curtain);
  q("#manual-curtain").addEventListener("input", (e) => {
    manual = Number(e.target.value);
    manualSheer = Number.parseInt(q("#sheer-value").textContent, 10);
    remaining = 60;
    curtain();
  });
  q("#advance-manual").addEventListener("click", () => {
    remaining = Math.max(0, remaining - 15);
    curtain();
  });
  q("#reset-curtain").addEventListener("click", () => {
    remaining = 0;
    scene = "auto";
    curtain();
  });
  curtain();
})();
