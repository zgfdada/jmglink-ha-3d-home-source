export const MODEL_FAVORITES_KEY =
  "ha3d.device-development-center.model-favorites.v1";

export function modelReferenceCount(platform, id) {
  return (
    (platform?.bindings ?? []).filter((item) => item.modelTemplateId === id)
      .length +
    (platform?.deviceTemplates ?? []).filter(
      (item) => item.modelTemplateId === id,
    ).length
  );
}

export function buildModelCards(platform) {
  const local = (platform?.modelTemplates ?? []).map((model) => ({
    key: `local:${model.id}`,
    id: model.id,
    name: model.name,
    origin: "local",
    model,
    author: model.library?.repository ?? "本地模型",
    tags: model.tags ?? [],
    updatedAt: model.updatedAt ?? model.createdAt ?? "",
  }));
  return local;
}

export function filterModelCards(
  cards,
  { query = "", filter = "all", favorites = [] } = {},
) {
  const needle = query.trim().toLocaleLowerCase();
  const favoriteSet = new Set(favorites);
  return cards.filter((card) => {
    if (filter === "favorites" && !favoriteSet.has(card.key)) return false;
    if (filter === "local" && card.origin !== "local") return false;
    return (
      !needle ||
      [card.id, card.name, card.author, ...(card.tags ?? [])]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle)
    );
  });
}

export function createModelDraft(model) {
  return model
    ? structuredClone(model)
    : {
        id: `custom.model-${Date.now().toString(36)}`,
        name: "",
        enabled: true,
        furnitureEnabled: false,
        furnitureKind: "",
        tags: [],
        source: { type: "upload" },
        dimensions: { width: 0.62, depth: 0.68, height: 0.85 },
        scale: 1,
        anchor: { x: 0, y: 0, z: 0 },
        placement: "floor",
        elevation: 0,
        color: "#e8edf2",
        roughness: 0.62,
        metalness: 0.08,
      };
}
