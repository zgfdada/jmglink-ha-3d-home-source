import assert from "node:assert/strict";
import test from "node:test";
import {
  capabilityValueOptions,
  deviceValueLabel,
} from "../packages/schema/src/device-value-labels.js";
import { syncEnumValues } from "../apps/web/src/app/device-development-center/capability-model.js";
import { panelDisplayOptions } from "../apps/web/src/app/device-development-center/panel-designer-model.js";
import { testAction } from "../apps/server/src/device-platform/projectLifecycle.js";
import { normalizeCapability } from "../apps/server/src/device-platform/devicePlatformSchema.js";

test("washer modes use Chinese labels while preserving current HA options, order and action values", () => {
  const values = [
    "standard",
    "fast",
    "blanket",
    "wool",
    "embathe",
    "memory",
    "child",
    "strong_wash",
    "bucket_self_clean",
  ];
  const entity = {
    entityId: "select.washer_program",
    domain: "select",
    state: "standard",
    attributes: { options: values },
  };
  const capability = {
    capabilityId: "washer_program",
    dataType: "enum",
    access: "read-write",
    enumValues: [
      { value: "单脱水", label: "单脱水", source: "ha" },
      { value: "standard", label: "standard", source: "ha" },
    ],
  };
  const options = capabilityValueOptions(capability, entity);
  assert.deepEqual(
    options.map((item) => item.value),
    values,
  );
  assert.deepEqual(
    options.map((item) => item.label),
    [
      "标准洗",
      "快洗",
      "毛毯洗",
      "羊毛洗",
      "浸泡洗",
      "记忆洗",
      "童装洗",
      "强力洗",
      "桶自洁",
    ],
  );
  const synchronized = syncEnumValues(capability.enumValues, values, entity);
  assert.equal(
    synchronized.find((item) => item.value === "单脱水").status,
    "missing",
  );
  assert.equal(
    synchronized.find((item) => item.value === "standard").label,
    "标准洗",
  );
  assert.equal(
    panelDisplayOptions({ ...capability, enumValues: synchronized }).find(
      (item) => item.value === "fast",
    ).label,
    "快洗",
  );
  assert.deepEqual(
    testAction(
      {
        project: { capabilities: [capability] },
        binding: {
          capabilityMappings: {
            washer_program: { entityId: entity.entityId, attribute: "state" },
          },
        },
        entities: [entity],
      },
      "washer_program",
      "fast",
    ),
    { entityId: entity.entityId, type: "select_option", option: "fast" },
  );
});

test("custom labels and unsupported or unrelated values remain intact", () => {
  assert.equal(
    deviceValueLabel("standard", "我的常用洗", {
      capabilityId: "washer_program",
    }),
    "我的常用洗",
  );
  assert.equal(
    deviceValueLabel("new_mode", undefined, { capabilityId: "washer_program" }),
    "new_mode",
  );
  assert.equal(
    deviceValueLabel("fast", undefined, { entityId: "select.fan_speed" }),
    "fast",
  );
  assert.equal(
    deviceValueLabel("fast", undefined, {
      entityId: "select.irrigation_program",
    }),
    "fast",
  );
  assert.equal(deviceValueLabel("standby"), "待机");
});

test("HA-provided labels override automatic fallbacks while custom labels and provenance persist", () => {
  const entity = {
    entityId: "select.washer_program",
    stateLabels: { fast: "速洗" },
    attributes: { options: ["fast"] },
  };
  const initial = [
    { value: "fast", label: "快洗", source: "ha", labelSource: "fallback" },
  ];
  const synchronized = syncEnumValues(initial, ["fast"], entity);
  assert.equal(synchronized[0].label, "速洗");
  assert.equal(synchronized[0].labelSource, "ha");
  const updated = syncEnumValues(synchronized, ["fast"], {
    ...entity,
    stateLabels: { fast: "集成更新后的名称" },
  });
  assert.equal(updated[0].label, "集成更新后的名称");
  const custom = syncEnumValues(
    [{ ...synchronized[0], label: "我的常用模式", labelSource: "custom" }],
    ["fast"],
    entity,
  );
  assert.equal(custom[0].label, "我的常用模式");
  assert.equal(normalizeCapability({ capabilityId: "program", kind: "enum", enumValues: custom }).enumValues[0].labelSource, "custom");
  assert.equal(
    capabilityValueOptions({ enumValues: initial }, entity)[0].label,
    "速洗",
  );
  assert.equal(
    panelDisplayOptions({
      enumValues: initial,
      stateLabels: entity.stateLabels,
    })[0].label,
    "速洗",
  );
});
