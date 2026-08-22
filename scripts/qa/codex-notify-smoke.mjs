import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

import { createCodexNotifier } from "@feelso/louder/codex";

const rawPayload = process.argv.at(-1);
assert.equal(typeof rawPayload, "string");

const event = JSON.parse(rawPayload);
assert.equal(event.type, "agent-turn-complete");
assert.equal(typeof event["thread-id"], "string");
assert.equal(typeof event["turn-id"], "string");
assert.equal(typeof event.cwd, "string");
assert.equal(Array.isArray(event["input-messages"]), true);

const dispatches = [];
const handled = await createCodexNotifier({
  dispatchStop: async () => {
    dispatches.push("Stop");
  },
})(rawPayload);

assert.equal(handled, true);
assert.deepEqual(dispatches, ["Stop"]);

const result = {
  status: "PASS",
  packageExport: "@feelso/louder/codex",
  eventType: event.type,
  threadId: event["thread-id"],
  turnId: event["turn-id"],
  cwd: event.cwd,
  inputMessages: event["input-messages"],
  lastAssistantMessage: event["last-assistant-message"] ?? null,
  dispatches,
};

if (process.env.CODEX_NOTIFY_CAPTURE) {
  await writeFile(
    process.env.CODEX_NOTIFY_CAPTURE,
    `${JSON.stringify(result)}\n`,
    "utf8",
  );
}

console.log(JSON.stringify(result));
