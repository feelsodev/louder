import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("exposes an explicit OMO package entry", async () => {
  // Given: the published package metadata consumed by OMO's installer.
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  // When: a user requests the explicit OMO package export.
  const omoExport = packageJson.exports?.["./omo"];

  // Then: it resolves to the same adapter OMO discovers through pi.extensions.
  assert.equal(omoExport, "./pi-extension/louder.js");
  assert.deepEqual(packageJson.pi?.extensions, ["./pi-extension/louder.js"]);
});

test("releases the HapticEngine when a pi session shuts down", async () => {
  // Given: a loaded extension with an observable haptic-engine disposer.
  const handlers = new Map();
  let disposeCount = 0;
  const extension = createLouderExtension({
    notify: async () => {},
    dispose: async () => {
      disposeCount += 1;
    },
  });
  extension({
    on(eventName, handler) {
      handlers.set(eventName, handler);
    },
  });

  // When: OMO emits the standard pi-family shutdown event.
  await handlers.get("session_shutdown")({ type: "session_shutdown" });

  // Then: the persistent native haptic child is released exactly once.
  assert.equal(disposeCount, 1);
});
