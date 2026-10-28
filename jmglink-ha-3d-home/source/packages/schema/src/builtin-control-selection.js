// 精简内置库，以 8101 在 2026-10-28 保留的 12 项为准；不含设备绑定或用户数据。
export const BUILTIN_CONTROL_SELECTION = [
  {
    "id": "builtin.toggle.segmented",
    "name": "开关 · 双态按钮",
    "description": "开启、关闭并列",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "toggle",
    "variant": "segmented",
    "icon": "▥",
    "dataTypes": [
      "boolean"
    ],
    "category": "data",
    "width": 2,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "confirm",
        "label": "执行操作前确认",
        "type": "boolean",
        "description": "",
        "default": false
      }
    ]
  },
  {
    "id": "builtin.button.full",
    "name": "按钮 · 整行按钮",
    "description": "占满控件宽度",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "button",
    "variant": "full",
    "icon": "▰",
    "dataTypes": [
      "action",
      "boolean"
    ],
    "category": "data",
    "width": 1,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "confirm",
        "label": "执行操作前确认",
        "type": "boolean",
        "description": "",
        "default": false
      }
    ]
  },
  {
    "id": "builtin.select.dropdown",
    "name": "选择器 · 下拉选择",
    "description": "节省画板空间",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "select",
    "variant": "dropdown",
    "icon": "⌄",
    "dataTypes": [
      "enum"
    ],
    "category": "data",
    "width": 2,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "confirm",
        "label": "执行操作前确认",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "optionSource",
        "label": "选项数据",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "ha",
            "label": "从能力自动读取"
          },
          {
            "value": "custom",
            "label": "自定义显示"
          }
        ],
        "default": "ha"
      }
    ]
  },
  {
    "id": "builtin.select.grid",
    "name": "选择器 · 平铺网格",
    "description": "选项分列排列",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "select",
    "variant": "grid",
    "icon": "▦",
    "dataTypes": [
      "enum"
    ],
    "category": "data",
    "width": 2,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "confirm",
        "label": "执行操作前确认",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "optionSource",
        "label": "选项数据",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "ha",
            "label": "从能力自动读取"
          },
          {
            "value": "custom",
            "label": "自定义显示"
          }
        ],
        "default": "ha"
      }
    ]
  },
  {
    "id": "builtin.slider.steps",
    "name": "滑块 · 刻度滑轨",
    "description": "显示离散刻度",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "slider",
    "variant": "steps",
    "icon": "┼┼",
    "dataTypes": [
      "number"
    ],
    "category": "data",
    "width": 2,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "content",
        "label": "显示内容",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "unit",
        "label": "单位",
        "type": "string",
        "description": "留空时读取能力或 HA 单位",
        "default": ""
      },
      {
        "key": "hideUnit",
        "label": "隐藏单位",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "min",
        "label": "最小值",
        "type": "number",
        "description": ""
      },
      {
        "key": "max",
        "label": "最大值",
        "type": "number",
        "description": ""
      },
      {
        "key": "step",
        "label": "步长",
        "type": "number",
        "description": "",
        "min": 0.000001
      },
      {
        "key": "confirm",
        "label": "执行操作前确认",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "valueAlign",
        "label": "数值对齐",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "flex-start",
            "label": "左对齐"
          },
          {
            "value": "center",
            "label": "居中"
          },
          {
            "value": "flex-end",
            "label": "右对齐"
          }
        ],
        "default": "center"
      }
    ]
  },
  {
    "id": "builtin.number.stepper",
    "name": "数值调节 · 步进调节",
    "description": "增减按钮两侧排列",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "number",
    "variant": "stepper",
    "icon": "−+",
    "dataTypes": [
      "number"
    ],
    "category": "data",
    "width": 2,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "content",
        "label": "显示内容",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "unit",
        "label": "单位",
        "type": "string",
        "description": "留空时读取能力或 HA 单位",
        "default": ""
      },
      {
        "key": "hideUnit",
        "label": "隐藏单位",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "min",
        "label": "最小值",
        "type": "number",
        "description": ""
      },
      {
        "key": "max",
        "label": "最大值",
        "type": "number",
        "description": ""
      },
      {
        "key": "step",
        "label": "步长",
        "type": "number",
        "description": "",
        "min": 0.000001
      },
      {
        "key": "confirm",
        "label": "执行操作前确认",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "valueAlign",
        "label": "数值对齐",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "flex-start",
            "label": "左对齐"
          },
          {
            "value": "center",
            "label": "居中"
          },
          {
            "value": "flex-end",
            "label": "右对齐"
          }
        ],
        "default": "center"
      }
    ]
  },
  {
    "id": "builtin.number.metric",
    "name": "数值调节 · 大字数值",
    "description": "突出当前数值",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "number",
    "variant": "metric",
    "icon": "38",
    "dataTypes": [
      "number"
    ],
    "category": "data",
    "width": 2,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "content",
        "label": "显示内容",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "unit",
        "label": "单位",
        "type": "string",
        "description": "留空时读取能力或 HA 单位",
        "default": ""
      },
      {
        "key": "hideUnit",
        "label": "隐藏单位",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "min",
        "label": "最小值",
        "type": "number",
        "description": ""
      },
      {
        "key": "max",
        "label": "最大值",
        "type": "number",
        "description": ""
      },
      {
        "key": "step",
        "label": "步长",
        "type": "number",
        "description": "",
        "min": 0.000001
      },
      {
        "key": "confirm",
        "label": "执行操作前确认",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "valueAlign",
        "label": "数值对齐",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "flex-start",
            "label": "左对齐"
          },
          {
            "value": "center",
            "label": "居中"
          },
          {
            "value": "flex-end",
            "label": "右对齐"
          }
        ],
        "default": "center"
      }
    ]
  },
  {
    "id": "builtin.progress.line",
    "name": "进度条 · 线性进度",
    "description": "连续进度条",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "progress",
    "variant": "line",
    "icon": "━",
    "dataTypes": [
      "number"
    ],
    "category": "data",
    "width": 4,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "content",
        "label": "显示内容",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "unit",
        "label": "单位",
        "type": "string",
        "description": "留空时读取能力或 HA 单位",
        "default": ""
      },
      {
        "key": "hideUnit",
        "label": "隐藏单位",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "min",
        "label": "最小值",
        "type": "number",
        "description": ""
      },
      {
        "key": "max",
        "label": "最大值",
        "type": "number",
        "description": ""
      },
      {
        "key": "step",
        "label": "步长",
        "type": "number",
        "description": "",
        "min": 0.000001
      },
      {
        "key": "valueAlign",
        "label": "数值对齐",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "flex-start",
            "label": "左对齐"
          },
          {
            "value": "center",
            "label": "居中"
          },
          {
            "value": "flex-end",
            "label": "右对齐"
          }
        ],
        "default": "center"
      }
    ]
  },
  {
    "id": "builtin.progress.steps",
    "name": "进度条 · 分段进度",
    "description": "分段展示进度",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "progress",
    "variant": "steps",
    "icon": "▰▰",
    "dataTypes": [
      "number"
    ],
    "category": "data",
    "width": 4,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "content",
        "label": "显示内容",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "unit",
        "label": "单位",
        "type": "string",
        "description": "留空时读取能力或 HA 单位",
        "default": ""
      },
      {
        "key": "hideUnit",
        "label": "隐藏单位",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "min",
        "label": "最小值",
        "type": "number",
        "description": ""
      },
      {
        "key": "max",
        "label": "最大值",
        "type": "number",
        "description": ""
      },
      {
        "key": "step",
        "label": "步长",
        "type": "number",
        "description": "",
        "min": 0.000001
      },
      {
        "key": "valueAlign",
        "label": "数值对齐",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "flex-start",
            "label": "左对齐"
          },
          {
            "value": "center",
            "label": "居中"
          },
          {
            "value": "flex-end",
            "label": "右对齐"
          }
        ],
        "default": "center"
      }
    ]
  },
  {
    "id": "builtin.progress.circle",
    "name": "进度条 · 环形进度",
    "description": "圆环与百分比",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "progress",
    "variant": "circle",
    "icon": "◕",
    "dataTypes": [
      "number"
    ],
    "category": "data",
    "width": 4,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "content",
        "label": "显示内容",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "unit",
        "label": "单位",
        "type": "string",
        "description": "留空时读取能力或 HA 单位",
        "default": ""
      },
      {
        "key": "hideUnit",
        "label": "隐藏单位",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "min",
        "label": "最小值",
        "type": "number",
        "description": ""
      },
      {
        "key": "max",
        "label": "最大值",
        "type": "number",
        "description": ""
      },
      {
        "key": "step",
        "label": "步长",
        "type": "number",
        "description": "",
        "min": 0.000001
      },
      {
        "key": "valueAlign",
        "label": "数值对齐",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "flex-start",
            "label": "左对齐"
          },
          {
            "value": "center",
            "label": "居中"
          },
          {
            "value": "flex-end",
            "label": "右对齐"
          }
        ],
        "default": "center"
      }
    ]
  },
  {
    "id": "builtin.text.quote",
    "name": "文本 · 引用文本",
    "description": "适合说明语",
    "author": "内置",
    "version": 1,
    "builtin": true,
    "enabled": true,
    "type": "text",
    "variant": "quote",
    "icon": "“”",
    "dataTypes": [
      "string",
      "boolean",
      "number",
      "enum"
    ],
    "category": "general",
    "width": 2,
    "style": {},
    "ui": {
      "kind": "native",
      "style": {}
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "content",
        "label": "显示内容",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "unit",
        "label": "单位",
        "type": "string",
        "description": "留空时读取能力或 HA 单位",
        "default": ""
      },
      {
        "key": "hideUnit",
        "label": "隐藏单位",
        "type": "boolean",
        "description": "",
        "default": false
      },
      {
        "key": "valueAlign",
        "label": "文本对齐",
        "type": "select",
        "description": "",
        "options": [
          {
            "value": "flex-start",
            "label": "左对齐"
          },
          {
            "value": "center",
            "label": "居中"
          },
          {
            "value": "flex-end",
            "label": "右对齐"
          }
        ],
        "default": "center"
      }
    ]
  },
  {
    "id": "builtin.divider.dashed",
    "name": "分割线 · 虚线",
    "description": "轻量分隔",
    "author": "内置",
    "version": 2,
    "builtin": true,
    "enabled": true,
    "type": "divider",
    "variant": "dashed",
    "icon": "┄",
    "dataTypes": [
      "string",
      "boolean",
      "number",
      "enum"
    ],
    "category": "general",
    "width": 4,
    "style": {
      "padding": "5px 8px",
      "border": "1px solid #ffffff38",
      "borderRadius": "10px",
      "background": "#ffffff0d"
    },
    "ui": {
      "kind": "column",
      "style": {
        "gap": "2px",
        "justifyContent": "flex-start"
      },
      "children": [
        {
          "kind": "row",
          "style": {
            "gap": "4px",
            "alignItems": "center",
            "maxHeight": "20px"
          },
          "children": [
            {
              "kind": "icon",
              "style": {
                "fontSize": "12px"
              }
            },
            {
              "kind": "label",
              "style": {
                "fontSize": "12px",
                "fontWeight": 600
              }
            }
          ]
        },
        {
          "kind": "divider",
          "style": {
            "borderTop": "1px dashed #ffffff38"
          }
        }
      ]
    },
    "properties": [
      {
        "key": "label",
        "label": "标题",
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "key": "icon",
        "label": "图标",
        "type": "string",
        "description": "",
        "default": ""
      }
    ]
  }
];
