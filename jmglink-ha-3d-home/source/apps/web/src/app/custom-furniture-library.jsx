import { a as React } from "../vendor/react.js";
import { r as getReactDom } from "../vendor/three.js";
import ModelPreview from "./device-development-center/model-preview.jsx";

const ReactDom = getReactDom();

export function CustomFurnitureLibrary({ models, selectedKey, onSelect }) {
  const [expanded, setExpanded] = React.useState(false);
  const [previewModel, setPreviewModel] = React.useState(null);
  if (!models.length) return null;
  return (
    <>
      <button
        className={`custom-furniture-parent${expanded ? " active" : ""}`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className="custom-furniture-parent-icon">3D</span>
        <span>
          <strong>自定义家具</strong>
          <small>{models.length} 个可用模型 · 点击展开</small>
        </span>
      </button>
      {expanded && (
        <div className="custom-furniture-children">
          {models.map((model) => {
            const key = `model:${model.id}`;
            return (
              <article
                className={`custom-furniture-model-card${selectedKey === key ? " active" : ""}`}
                key={model.id}
              >
                <button
                  className="custom-furniture-thumbnail"
                  onClick={() => setPreviewModel(model)}
                  title={`放大查看 ${model.name}`}
                >
                  <ModelPreview model={model} compact />
                  <span>放大查看</span>
                </button>
                <button
                  className="custom-furniture-select"
                  onClick={() => onSelect(key)}
                  aria-pressed={selectedKey === key}
                >
                  <strong>{model.name}</strong>
                  <small>
                    {model.dimensions.width} × {model.dimensions.depth} m
                  </small>
                </button>
              </article>
            );
          })}
        </div>
      )}
      {previewModel &&
        typeof document !== "undefined" &&
        ReactDom.createPortal(
          <aside
            className="custom-furniture-preview-panel"
            aria-label={`${previewModel.name} 模型预览`}
          >
            <header>
              <div>
                <small>自定义家具模型</small>
                <strong>{previewModel.name}</strong>
                <span>左键旋转 · 滚轮缩放 · 右键平移 · 双击复位</span>
              </div>
              <button
                onClick={() => setPreviewModel(null)}
                aria-label="关闭模型预览"
              >
                ×
              </button>
            </header>
            <ModelPreview model={previewModel} />
          </aside>,
          document.body,
        )}
    </>
  );
}
