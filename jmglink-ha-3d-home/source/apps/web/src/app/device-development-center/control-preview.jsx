import {a as React} from '../../vendor/react.js';
import ControlProperties from '../../components/control-properties.jsx';
import DevicePanel from '../../components/device-panel.jsx';
import {samplePanelStates} from '../../domain/device-panel.js';
import {attachLibraryControl} from '../../../../../packages/schema/src/control-library.js';
export default function ControlPreview({ definition, configure = false, onDefaultChange }) {
  const [values, setValues] = React.useState({});
  const [props, setProps] = React.useState({});

  const cap = {
    capabilityId: "demo",
    name: "示例能力",
    kind:
      definition.dataTypes[0] === "number"
        ? "number"
        : definition.dataTypes[0] === "boolean"
          ? "toggle"
          : definition.dataTypes[0] === "action"
            ? "action"
            : definition.dataTypes[0] === "enum"
              ? "enum"
              : "status",
    dataType: definition.dataTypes[0],
    access: "read-write",
    unit: "",
    enumValues: [
      { value: "standard", label: "标准" },
      { value: "quick", label: "速洗" },
      { value: "gentle", label: "轻柔" },
    ],
  };
  const control = attachLibraryControl(
    {
      id: "preview",
      label: definition.name,
      icon: definition.icon,
      capabilityId: "demo",
      props,
      grid: { x: 0, y: 0, w: 4 },
    },
    definition,
  );
  return (
    <>
      <div className="cl-preview">
        <DevicePanel
          panel={{
            layoutMode: "grid",
            sections: [{ id: "preview", controls: [control] }],
          }}
          states={samplePanelStates([cap], values)}
          interactive
          onAction={(id, value) =>
            setValues((current) => ({ ...current, [id]: value }))
          }
        />
      </div>
      {configure && (
        <div className="cl-preview-properties">
          <h4>{onDefaultChange ? "控件默认属性（需应用并保存）" : "预览属性（仅本地模拟）"}</h4>
          <ControlProperties
            definition={definition}
            control={control}
            onChange={(key, value) => onDefaultChange
              ? onDefaultChange(key, value)
              : setProps((current) => ({ ...current, [key]: value }))}
          />
        </div>
      )}
    </>
  );
}
