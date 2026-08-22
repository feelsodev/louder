import assert from "node:assert/strict";
import test from "node:test";

import { createLouderExtension } from "../pi-extension/louder.js";

function createHarness() {
  const handlers = new Map();
  const notifications = [];
  const extension = createLouderExtension({
    notify: async (soundType) => {
      notifications.push(soundType);
    },
  });

  extension({
    on(eventName, handler) {
      handlers.set(eventName, handler);
    },
  });

  return { handlers, notifications };
}

test("notifies when a pi session becomes idle", async () => {
  // Given: a loaded pi-compatible Louder extension and an active agent run.
  const { handlers, notifications } = createHarness();
  await handlers.get("agent_start")({ type: "agent_start" });

  // When: the common pi-family completion event is emitted.
  await handlers.get("agent_end")({
    type: "agent_end",
    messages: [{ role: "assistant", stopReason: "stop" }],
  });

  // Then: Louder emits exactly one success notification.
  assert.deepEqual(notifications, ["success"]);
});

test("maps pi errors and input requests without duplicate completion feedback", async () => {
  // Given: a pi-family runtime with no documented input-needed event.
  const { handlers, notifications } = createHarness();
  assert.equal(handlers.has("input"), false);
  await handlers.get("agent_start")({ type: "agent_start" });
  const errorEnd = {
    type: "agent_end",
    messages: [
      {
        role: "assistant",
        stopReason: "error",
        errorMessage: "provider failed",
      },
    ],
  };

  // When: an error-shaped completion is emitted twice.
  await handlers.get("agent_end")(errorEnd);
  await handlers.get("agent_end")(errorEnd);

  // Then: Louder emits one error notification and suppresses the duplicate.
  assert.deepEqual(notifications, ["error"]);
});
