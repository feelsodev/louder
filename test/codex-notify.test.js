import assert from "node:assert/strict";
import test from "node:test";

import { createCodexNotifier } from "../codex/louder-notify.js";

test("forwards Codex agent-turn-complete to Louder", async () => {
  // Given: the official Codex legacy-notify payload and a captured Stop dispatch.
  const dispatches = [];
  const notify = createCodexNotifier({
    dispatchStop: async () => {
      dispatches.push("Stop");
    },
  });
  const payload = JSON.stringify({
    type: "agent-turn-complete",
    "thread-id": "thread-test",
    "turn-id": "turn-test",
    cwd: "/tmp/project",
    client: "codex-tui",
    "input-messages": ["Fix the bug"],
    "last-assistant-message": "Done",
  });

  // When: Codex appends the payload as the command's final argument.
  const handled = await notify(payload);

  // Then: Louder receives exactly one completion dispatch.
  assert.equal(handled, true);
  assert.deepEqual(dispatches, ["Stop"]);
});

test("ignores malformed Codex notification payloads", async () => {
  // Given: a notifier with an observable Stop dispatch.
  let dispatchCount = 0;
  const notify = createCodexNotifier({
    dispatchStop: async () => {
      dispatchCount += 1;
    },
  });

  // When: the final argv value is not JSON.
  const handled = await notify("not-json");

  // Then: the command exits quietly without false feedback.
  assert.equal(handled, false);
  assert.equal(dispatchCount, 0);
});
