import { readFile, writeFile } from "node:fs/promises";

const files = {
  editor: new URL("./extracted-image/apps/web/dist/assets/FloorplanEditor-CWRaEIlm.js", import.meta.url),
  renderer: new URL("./extracted-image/apps/web/dist/assets/AppSelect-DDRORnJ8.js", import.meta.url),
  schema: new URL("./extracted-image/packages/schema/dist/index.js", import.meta.url),
  types: new URL("./extracted-image/packages/schema/dist/index.d.ts", import.meta.url),
};

async function replaceOnce(file, replacements, marker) {
  let source = await readFile(file, "utf8");
  if (source.includes(marker)) {
    console.log(`Already patched: ${file.pathname}`);
    return;
  }

  for (const [before, after, description] of replacements) {
    const first = source.indexOf(before);
    const second = first < 0 ? -1 : source.indexOf(before, first + before.length);
    if (first < 0 || second >= 0) {
      throw new Error(`${description}: expected exactly one match, found ${first < 0 ? 0 : 2}`);
    }
    source = source.replace(before, after);
  }

  if (!source.includes(marker)) {
    throw new Error(`Patch marker was not written: ${marker}`);
  }
  await writeFile(file, source, "utf8");
  console.log(`Patched: ${file.pathname}`);
}

await replaceOnce(
  files.editor,
  [
    [
      '},Xc=new Set(["wash_basin","toilet","water_heater","squat_toilet"]),wr=',
      '},CabinetFurnitureKinds=new Set(["wardrobe","cabinet","tv_stand","bookshelf","sideboard","shoe_cabinet","nightstand"]),Xc=new Set(["wash_basin","toilet","water_heater","squat_toilet"]),wr=',
      "cabinet furniture kind set",
    ],
    [
      'rotation:0,width:p.width,depth:p.depth,height:p.height};F(g=>',
      'rotation:0,width:p.width,depth:p.depth,height:p.height,elevation:CabinetFurnitureKinds.has(Qt)?0:void 0};F(g=>',
      "new furniture elevation default",
    ],
    [
      't.jsxs("label",{children:[t.jsx("span",{children:"旋转"})',
      'CabinetFurnitureKinds.has(R.kind)&&t.jsxs("label",{children:[t.jsx("span",{children:"离地高度"}),t.jsxs("div",{className:"unit-input",children:[t.jsx("input",{type:"number",min:"0",max:"12",step:"0.05",value:Number((R.elevation??0).toFixed(2)),onChange:e=>F(n=>({...n,furniture:n.furniture.map(a=>a.id===R.id?{...a,elevation:Math.max(0,Math.min(12,Number(e.target.value)||0))}:a)}))}),t.jsx("i",{children:"m"})]})]}),t.jsxs("label",{children:[t.jsx("span",{children:"旋转"})',
      "cabinet elevation editor field",
    ],
  ],
  "CabinetFurnitureKinds",
);

await replaceOnce(
  files.renderer,
  [
    [
      'return t.jsx("group",{position:[e.position[0],0,e.position[1]],rotation:[0,-e.rotation,0],scale:',
      'return t.jsx("group",{position:[e.position[0],Math.max(0,e.elevation??0),e.position[1]],rotation:[0,-e.rotation,0],scale:',
      "shared 3D furniture elevation",
    ],
  ],
  "Math.max(0,e.elevation??0)",
);

await replaceOnce(
  files.schema,
  [
    [
      'height: finite(source.height, size.height, 0.1, 12),\n        modelId:',
      'height: finite(source.height, size.height, 0.1, 12),\n        elevation: finite(source.elevation, 0, 0, 12),\n        modelId:',
      "furniture elevation normalization",
    ],
  ],
  "elevation: finite(source.elevation, 0, 0, 12)",
);

await replaceOnce(
  files.types,
  [
    [
      '    height: number;\n    modelId?: string;\n};\nexport type Floor =',
      '    height: number;\n    /** Distance in meters from the floor to the bottom of the furniture. */\n    elevation?: number;\n    modelId?: string;\n};\nexport type Floor =',
      "furniture elevation type",
    ],
  ],
  "Distance in meters from the floor",
);

