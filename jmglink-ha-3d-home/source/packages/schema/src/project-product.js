export function productIdentity(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const placeholder = /^(?:未知(?:厂家|厂商|品牌|型号)?|未(?:配置|设置|填写|标注)(?:厂家|厂商|品牌|型号)?|用户配置|用户自定义|自定义设备项目|unknown|user configured|n\/a|[-—]+)$/i;
  return placeholder.test(trimmed) ? "" : trimmed;
}

export function projectProductError(project) {
  if (project.isStandardProduct == null || project.isStandardProduct === false) return "";
  if (project.isStandardProduct !== true) return "产品属性无效。";
  if (!productIdentity(project.manufacturer) || !productIdentity(project.model)) return "标准品需填写厂商和产品型号。";
  return "";
}
