function modelCandidates(payload) {
  if (Array.isArray(payload?.modelTemplates)) return payload.modelTemplates;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload?.model && typeof payload.model === "object") {
    return [payload.model];
  }
  return payload?.id ? [payload] : [];
}

export function parseModelTemplateJson(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("所选 JSON 文件格式无效");
  }
  const model = modelCandidates(payload).find(
    (item) =>
      item &&
      typeof item.id === "string" &&
      ["procedural", "upload"].includes(item.source?.type),
  );
  if (!model) {
    throw new Error("JSON 中没有可用的 3D 模型模板");
  }
  const imported = structuredClone(model);
  imported.builtin = false;
  const asset = (payload.assets ?? []).find(
    (item) => item.modelTemplateId === imported.id && item.dataBase64,
  );
  if (imported.source.type === "upload" && !asset) {
    throw new Error(
      "该模板没有内嵌模型文件；请使用完整导出包，或另行选择 GLB/GLTF 文件",
    );
  }
  if (!asset) return { model: imported, file: null, previewUrl: null };
  const mimeType = asset.mimeType || imported.source.mimeType;
  const dataUrl = `data:${mimeType || "application/octet-stream"};base64,${asset.dataBase64}`;
  return {
    model: imported,
    file: {
      name: asset.fileName || imported.source.fileName || `${imported.id}.glb`,
      dataUrl,
    },
    previewUrl: dataUrl,
  };
}
