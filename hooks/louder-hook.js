#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";

const execFileAsync = promisify(execFile);

const DEFAULT_CONFIG = {
  sound: true,
  haptic: false,
  delay: 0,
  events: {}
};

function loadConfig() {
  let config = { ...DEFAULT_CONFIG };
  
  const globalPath = `${homedir()}/.louderrc.json`;
  if (existsSync(globalPath)) {
    try {
      const data = JSON.parse(readFileSync(globalPath, "utf-8"));
      config = { ...config, ...data };
    } catch {}
  }
  
  const localPath = ".louderrc.json";
  if (existsSync(localPath)) {
    try {
      const data = JSON.parse(readFileSync(localPath, "utf-8"));
      config = { ...config, ...data };
    } catch {}
  }
  
  return config;
}

const SOUND_MAP = {
  success: "/System/Library/Sounds/Glass.aiff",
  error: "/System/Library/Sounds/Basso.aiff",
  info: "/System/Library/Sounds/Blow.aiff",
  warning: "/System/Library/Sounds/Sosumi.aiff",
  progress: "/System/Library/Sounds/Tink.aiff",
  reminder: "/System/Library/Sounds/Ping.aiff",
  default: "/System/Library/Sounds/Glass.aiff",
};

async function playSound(soundType, soundPath) {
  if (soundType === "silent" || soundType === false) return;
  
  const path = soundPath || SOUND_MAP[soundType] || SOUND_MAP.default;
  
  try {
    await execFileAsync("afplay", [path], { timeout: 4000 });
  } catch {}
}

let hapticInstance = null;

async function getHapticInstance() {
  if (hapticInstance) return hapticInstance;
  
  try {
    const module = await import("haptic-feedback-swift");
    hapticInstance = new module.HapticFeedback();
    return hapticInstance;
  } catch {
    return null;
  }
}

async function playHaptic(hapticType) {
  if (!hapticType || hapticType === false) return;
  
  if (process.platform !== "darwin") return;
  
  const instance = await getHapticInstance();
  if (!instance) return;
  
  const pattern = hapticType === "error" ? "generic" : "levelChange";
  try {
    instance.trigger(pattern);
  } catch {}
}

const EVENT_DEFAULTS = {
  Stop: { echoEvent: "stop", soundType: "success" },
  Notification: { echoEvent: "notification", soundType: "info" },
};

function getSoundType(hookEvent, config) {
  const defaults = EVENT_DEFAULTS[hookEvent];
  if (!defaults) return null;
  
  const eventConfig = config.events?.[defaults.echoEvent];
  if (eventConfig === false) return null;
  
  if (typeof eventConfig === "string") return eventConfig;
  if (config.sound === false) return null;
  if (typeof config.sound === "string") return config.sound;
  
  return defaults.soundType;
}

async function handleHook(input) {
  const config = loadConfig();
  const hookEvent = input.hook_event_name;
  
  const soundType = getSoundType(hookEvent, config);
  
  if (soundType) {
    await playSound(soundType, config.soundPath);
  }
  
  if (config.haptic) {
    const hapticType = config.haptic === true ? "success" : config.haptic;
    await playHaptic(hapticType);
  }
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });
}

async function main() {
  try {
    const input = await readStdin();
    const hookInput = JSON.parse(input);
    await handleHook(hookInput);
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
