import { Readable, Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parser } from "stream-json/parser.js";
import { streamValues } from "stream-json/streamers/stream-values.js";

export const INSTANCE_BODY_LIMIT = 128 * 1024 * 1024;

// Do not retain the complete UTF-8/UTF-16 request alongside the parsed instance.
// Keep Fastify's other JSON routes on its standard, small-request parser.
export async function readInstanceJson(
  source,
  { limit = INSTANCE_BODY_LIMIT } = {},
) {
  let bytes = 0,
    depth = 0,
    count = 0,
    value;
  const input = Readable.from(
    (async function* () {
      for await (const chunk of source.iterator({ destroyOnReturn: false })) {
        bytes += Buffer.byteLength(chunk);
        if (bytes > limit)
          throw Object.assign(Error("备份超过 128MB"), { statusCode: 413 });
        yield chunk;
      }
    })(),
  );
  try {
    await pipeline(
      input,
      parser.asStream({ streamValues: false }),
      new Transform({
        objectMode: true,
        transform(token, encoding, done) {
          if (token.name === "startObject" || token.name === "startArray")
            depth++;
          if (token.name === "endObject" || token.name === "endArray") depth--;
          if (
            depth > 256 ||
            (token.name === "keyValue" && token.value === "__proto__")
          ) {
            done(
              Object.assign(Error("备份 JSON 结构不安全或嵌套过深"), {
                statusCode: 400,
              }),
            );
          } else done(null, token);
        },
      }),
      streamValues.asStream(),
      new Writable({
        objectMode: true,
        write(item, encoding, done) {
          count++;
          value = item.value;
          done();
        },
      }),
    );
    if (count !== 1) throw Error("Expected one JSON document");
    return value;
  } catch (error) {
    if (error.statusCode) throw error;
    throw Object.assign(Error("备份 JSON 不完整或格式不正确"), {
      statusCode: 400,
    });
  }
}
