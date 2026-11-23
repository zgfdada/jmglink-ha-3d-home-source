import {a as React} from "../vendor/react.js";

export function PlacementDimensions({size, onChange, maxHeight=20}) {
  return <div className="property-section"><h3>摆放尺寸</h3>
    {Object.entries({width:"宽度",depth:"深度",height:"高度"}).map(([axis,label])=>{
      const value=Number(size[axis].toFixed(3));
      return <label key={axis}><span>{label}</span><div className="unit-input">
        <input key={value} type="number" aria-label={label} min="0.05" max={axis==="height"?maxHeight:20} step="0.01"
          defaultValue={value} onKeyDown={event=>{if(event.key==="Enter")event.currentTarget.blur();}}
          onBlur={event=>{
            const input=event.currentTarget, next=input.valueAsNumber;
            if(!Number.isFinite(next)){input.value=value;return;}
            const bounded=Math.max(0.05,Math.min(axis==="height"?maxHeight:20,next));
            input.value=bounded;
            if(bounded!==value)onChange(axis,bounded);
          }}/><i>m</i></div></label>;
    })}
  </div>;
}
