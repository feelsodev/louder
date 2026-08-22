import assert from "node:assert/strict";

import louderExtension, { createLouderExtension } from "@feelso/louder/pi";

const handlers = new Map();
const notifications = [];
const defaultHandlers = new Map();

louderExtension({
  on(eventName, handler) {
    defaultHandlers.set(eventName, handler);
  },
});

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

assert.deepEqual([...handlers.keys()], ["agent_start", "agent_end"]);
assert.deepEqual([...defaultHandlers.keys()], ["agent_start", "agent_end"]);

await handlers.get("agent_start")({ type: "agent_start" });
await handlers.get("agent_end")({
  type: "agent_end",
  messages: [{ role: "assistant", stopReason: "stop" }],
});

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
await handlers.get("agent_end")(errorEnd);
await handlers.get("agent_end")(errorEnd);

assert.deepEqual(notifications, ["success", "error"]);

console.log(JSON.stringify({
  status: "PASS",
  packageExport: "@feelso/louder/pi",
  defaultFactoryLoaded: true,
  registeredEvents: [...handlers.keys()],
  notifications,
  duplicateSuppressed: true,
}));
