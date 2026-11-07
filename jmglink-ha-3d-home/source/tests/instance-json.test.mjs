import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { readInstanceJson } from "../apps/server/src/routes/instanceJson.js";

test("instance JSON parses split UTF-8 without keeping a whole request string", async () => {
  const value = {
    name: "模型与侧栏",
    items: [true, null, 1.25, { text: '引号"\\换行\n' }],
  };
  const bytes = Buffer.from(JSON.stringify(value));
  assert.deepEqual(
    await readInstanceJson(
      Readable.from([...bytes].map((byte) => Buffer.from([byte]))),
    ),
    value,
  );
});

test("instance JSON rejects truncated, multiple, unsafe and oversized documents", async () => {
  for (const input of [
    '{"a":',
    "{} {}",
    '{"__proto__":{"polluted":true}}',
    "[".repeat(257) + "]".repeat(257),
  ]) {
    await assert.rejects(readInstanceJson(Readable.from([input])), {
      statusCode: 400,
    });
  }
  await assert.rejects(
    readInstanceJson(Readable.from(['{"a":', "12345}"]), { limit: 8 }),
    { statusCode: 413 },
  );
  assert.equal({}.polluted, undefined);
});
