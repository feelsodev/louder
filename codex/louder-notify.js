#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CODEX_COMPLETION_EVENT = "agent-turn-complete";

function runLouderStopHook() {
  return new Promise((resolveDispatch) => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const hookPath = join(currentDir, "..", "hooks", "louder-hook.js");
    const child = spawn(process.execPath, [hookPath], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    let settled = false;

    const settle = (result) => {
      if (settled) return;
      settled = true;
      resolveDispatch(result);
    };

    child.once("error", () => settle(false));
    child.once("exit", (code) => settle(code === 0));
    child.stdin.on("error", () => settle(false));
    child.stdin.end(JSON.stringify({ hook_event_name: "Stop" }));
  });
}

export function createCodexNotifier(options = {}) {
  const dispatchStop = options.dispatchStop || runLouderStopHook;

  return async function notify(rawPayload) {
    if (typeof rawPayload !== "string") return false;

    let event;
    try {
      event = JSON.parse(rawPayload);
    } catch {
      return false;
    }

    if (
      !event
      || typeof event !== "object"
      || event.type !== CODEX_COMPLETION_EVENT
    ) {
      return false;
    }

    await dispatchStop();
    return true;
  };
}

async function main() {
  const rawPayload = process.argv.at(-1);
  await createCodexNotifier()(rawPayload);
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (entryPath === fileURLToPath(import.meta.url)) {
  await main();
}
