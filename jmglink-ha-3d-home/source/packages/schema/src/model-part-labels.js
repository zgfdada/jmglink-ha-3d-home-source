const known = {
  top_load_pulsator_washer:"顶开式波轮洗衣机",cabinet:"机壳",lower_plinth:"下部底座",foot_l_rear:"左后机脚",foot_l_front:"左前机脚",foot_r_rear:"右后机脚",foot_r_front:"右前机脚",top_deck:"顶面板",tub_outer_rim:"内桶外沿",tub_opening:"内桶开口",lid_frame:"顶盖框架",lid_glass:"顶盖玻璃",lid_handle:"顶盖把手",control_console:"控制台",control_button:"控制按钮",front_top_seam:"前部顶面接缝",brand_badge:"品牌标牌",service_hatch:"检修盖板",side_grip_left:"左侧搬运把手",side_grip_right:"右侧搬运把手",
  heater_coil: "加热管",
  heating_coil: "加热管",
  water_tank: "水箱",
  valve_core: "阀芯",
  water_pipe: "水管",
  cabinet_frame: "外壳框架",
  pulsator_disc: "波轮盘",
  digital_display: "数码显示屏",
  body: "机身",
  shell: "外壳",
  housing: "外壳",
  door: "门板",
  handle: "把手",
  fan: "风扇",
  fan_blade: "扇叶",
  rotor: "转子",
  motor: "电机",
  led: "指示灯",
  indicator: "指示灯",
  screen: "显示屏",
  display: "显示屏",
  button: "按钮",
  valve: "阀门",
  pipe: "管道",
  tank: "水箱",
  pump: "水泵",
  filter: "滤芯",
  base: "底座",
  lid: "顶盖",
  cover: "盖板",
  hinge: "铰链",
  frame: "框架",
  mesh: "网格部件",
  group: "部件组",
};
export function modelPartLabel(part, labels = {}) {
  if (labels[part.path]) return labels[part.path];
  const name = String(part.name ?? "");
  if (/[\u4e00-\u9fff]/.test(name) && !/^未命名 /.test(name)) return name;
  if (part.path === "root") return "模型根节点";
  const normalized = name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[ .-]+/g, "_");
  if (known[normalized]) return known[normalized];
  const numbered = normalized.match(/^(.+?)[_\s]*(\d+)$/);
  if (numbered && known[numbered[1]])
    return `${known[numbered[1]]} ${numbered[2]}`;
  if (normalized.startsWith("pulsator_blade"))
    return "波轮叶片 " + (numbered?.[2] ?? "");
  return `${part.mesh ? "网格部件" : "部件组"} ${part.path.slice(5).replaceAll("/", "·") || "1"}`;
}
export function normalizePartLabels(value) {
  if (value === undefined) return {};
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length > 256
  )
    throw Error("部件中文名称格式无效");
  return Object.fromEntries(
    Object.entries(value).map(([path, label]) => {
      if (
        !/^root(?:\/[0-9]+)*$/.test(path) ||
        path.length > 1024 ||
        typeof label !== "string" ||
        label.length > 80 ||
        !/[\u4e00-\u9fff]/.test(label) ||
        /[<>\x00-\x1f]/.test(label)
      )
        throw Error("请输入有效的中文部件名称（最多 80 字）");
      return [path, label.trim()];
    }),
  );
}
