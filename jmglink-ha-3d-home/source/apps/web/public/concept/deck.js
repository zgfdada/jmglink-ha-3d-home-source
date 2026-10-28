(() => {
  const slides = [...document.querySelectorAll("main > section")];
  const names = {
    home: "项目理念",
    audience: "为谁而造",
    vision: "项目愿景",
    start: "开始构建",
  };
  const titles = slides.map((s) => s.dataset.title || names[s.id]);
  const stage = document.createElement("div");
  stage.className = "deck-stage";
  const deck = document.createElement("div");
  deck.className = "deck";
  stage.append(deck);
  document.body.prepend(stage);
  deck.append(
    document.querySelector(".site-header"),
    document.querySelector("main"),
    document.querySelector("footer"),
  );
  const credit = document.createElement("p");
  credit.className = "start-credit";
  credit.innerHTML =
    '基于 JMGLink HA 3D Home 二次开发 · 致敬并感谢 <a href="https://gitee.com/tuotuo4ever/jmglink-ha-3d-home">原作者及贡献者 ↗</a>';
  document.querySelector("#start").append(credit);
  const controls = document.createElement("nav");
  controls.className = "deck-nav";
  controls.setAttribute("aria-label", "演示章节");
  controls.innerHTML =
    '<button class="deck-prev" aria-label="上一页">←</button><div class="deck-chapters">' +
    slides
      .map(
        (s, i) =>
          `<button data-slide="${i}" aria-controls="${s.id}"><span>${String(i + 1).padStart(2, "0")}</span> ${titles[i]}</button>`,
      )
      .join("") +
    '</div><span class="deck-counter" aria-live="polite"></span><button class="deck-next" aria-label="下一页">→</button>';
  document.body.append(controls);
  const chapterSelect = document.createElement("select");
  chapterSelect.className = "deck-select";
  chapterSelect.setAttribute("aria-label", "跳转章节");
  chapterSelect.innerHTML = slides
    .map(
      (s, i) =>
        `<option value="${i}">${String(i + 1).padStart(2, "0")} / ${titles[i]}</option>`,
    )
    .join("");
  controls.querySelector(".deck-chapters").after(chapterSelect);
  chapterSelect.addEventListener("change", () =>
    go(Number(chapterSelect.value)),
  );
  let current = 0;
  function go(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((s, i) => {
      s.hidden = i !== current;
      s.inert = i !== current;
      s.setAttribute(
        "data-screen-label",
        `${String(i + 1).padStart(2, "0")} ${titles[i]}`,
      );
    });
    controls
      .querySelectorAll("[data-slide]")
      .forEach((b, i) =>
        b.setAttribute("aria-current", i === current ? "step" : "false"),
      );
    controls.querySelector(".deck-counter").textContent =
      `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    controls.querySelector(".deck-prev").disabled = current === 0;
    controls.querySelector(".deck-next").disabled =
      current === slides.length - 1;
    chapterSelect.value = String(current);
    deck.dataset.slide = String(current);
    if (updateHash) {
      try {
        history.replaceState(null, "", "#" + slides[current].id);
      } catch {
        location.hash = slides[current].id;
      }
    }
    try {
      localStorage.setItem("ha3d-concept-slide-v4", String(current));
    } catch {}
    window.postMessage({ slideIndexChanged: current + 1 }, "*");
    window.dispatchEvent(
      new CustomEvent("concept-slide-change", { detail: current }),
    );
  }
  function fit() {
    const scale = Math.max(
      0.05,
      Math.min(innerWidth / 1920, (innerHeight - 90) / 1080),
    );
    deck.style.transform = `translate(-50%,-50%) scale(${scale})`;
    document.documentElement.style.setProperty("--deck-scale", scale);
  }
  controls.addEventListener("click", (event) => {
    const b = event.target.closest("[data-slide]");
    if (b) go(Number(b.dataset.slide));
  });
  controls.querySelector(".deck-prev").onclick = () => go(current - 1);
  controls.querySelector(".deck-next").onclick = () => go(current + 1);
  document.addEventListener("click", (event) => {
    const a = event.target.closest('a[href^="#"]');
    if (!a) return;
    const target = a.getAttribute("href").slice(1);
    const index =
      !target || target === "main"
        ? 0
        : slides.findIndex((s) => s.id === target);
    if (index >= 0) {
      event.preventDefault();
      go(index);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.closest('input,textarea,select,[contenteditable="true"]'))
      return;
    if (
      ["ArrowRight", "PageDown", "ArrowLeft", "PageUp", "Home", "End"].includes(
        event.key,
      )
    ) {
      event.preventDefault();
      go(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? slides.length - 1
            : current +
              (["ArrowRight", "PageDown"].includes(event.key) ? 1 : -1),
      );
    }
  });
  window.addEventListener("hashchange", () => {
    const i = slides.findIndex((s) => s.id === location.hash.slice(1));
    if (i >= 0) go(i, false);
  });
  window.addEventListener("resize", fit);
  fit();
  let initial = slides.findIndex((s) => s.id === location.hash.slice(1));
  if (initial < 0) {
    try {
      initial = Number(localStorage.getItem("ha3d-concept-slide-v4")) || 0;
    } catch {
      initial = 0;
    }
  }
  go(initial, false);
})();
