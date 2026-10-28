import { a as React } from "../vendor/react.js";
export default function CameraPlanGlyph({ dual = false }) {
  return (
    <g className="camera-plan-glyph">
      <rect
        x="-.12"
        y="-.15"
        width=".24"
        height=".30"
        rx=".07"
        className="device-glyph-core"
      />
      {dual ? (
        <>
          <circle
            cx="0"
            cy="-.065"
            r=".035"
            className="device-glyph-stroke glyph-on-fill"
          />
          <circle
            cx="0"
            cy=".065"
            r=".035"
            className="device-glyph-stroke glyph-on-fill"
          />
        </>
      ) : (
        <circle
          cx="0"
          cy=".03"
          r=".055"
          className="device-glyph-stroke glyph-on-fill"
        />
      )}
      <path
        d="M -.075 .20 L 0 .29 L .075 .20"
        className="device-glyph-stroke"
      />
    </g>
  );
}
