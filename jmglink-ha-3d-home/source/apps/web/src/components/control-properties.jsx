import { a as React } from "../vendor/react.js";
import { defaultControlProperties } from "../../../../packages/schema/src/control-library.js";
export default function ControlProperties({ definition, control, onChange }) {
  const fields =
    definition?.properties ?? defaultControlProperties(control.type);
  return (
    <div className="hp-config-fields">
      {fields.map((field) => {
        const value =
          control.props?.[field.key] ?? control[field.key] ?? field.default;
        return (
          <label
            key={field.key}
            className={field.type === "boolean" ? "cl-checkbox" : ""}
          >
            {field.type !== "boolean" && field.label}
            {field.type === "boolean" ? (
              <>
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                />
                {field.label}
              </>
            ) : field.type === "select" ? (
              <select
                value={value ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                step="any"
                min={field.min}
                max={field.max}
                value={value ?? ""}
                onChange={(e) =>
                  onChange(
                    field.key,
                    field.type === "number"
                      ? e.target.value === ""
                        ? undefined
                        : Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            )}
            {field.description && <small>{field.description}</small>}
          </label>
        );
      })}
    </div>
  );
}
