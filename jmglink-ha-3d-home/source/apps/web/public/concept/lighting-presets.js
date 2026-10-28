(() => {
  const presets = {
    day: ["present", "dim", "day", "auto"],
    night: ["present", "dim", "night", "auto"],
    movie: ["present", "dim", "night", "movie"],
    away: ["absent", "dim", "day", "auto"],
  };
  const fields = [
    "#light-presence",
    "#light-environment",
    "#light-period",
    "#light-scene",
  ].map((s) => document.querySelector(s));
  const buttons = [...document.querySelectorAll("[data-light-preset]")];
  function sync() {
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(
          presets[button.dataset.lightPreset].every(
            (v, i) => fields[i].value === v,
          ),
        ),
      ),
    );
  }
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      presets[button.dataset.lightPreset].forEach((value, i) => {
        fields[i].value = value;
      });
      fields[0].dispatchEvent(new Event("change", { bubbles: true }));
    }),
  );
  fields.forEach((field) => field.addEventListener("change", sync));
  sync();
})();
