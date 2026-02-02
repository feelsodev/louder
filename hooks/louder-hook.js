#!/usr/bin/env node

import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const ACTUATION_STRONG = 15;
const ACTUATION_WEAK = 6;

const HAPTIC_ACTUATION_MAP = {
  success: ACTUATION_STRONG,
  error: ACTUATION_WEAK,
};

const DEFAULT_INTENSITY = {
  success: 2.0,
  error: 1.5,
};

let hapticEngine = null;
let enginePromise = null;

function getHapticEnginePath() {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return join(currentDir, "..", "native", "HapticEngine");
}

function resetEngine() {
  hapticEngine = null;
  enginePromise = null;
}

function getHapticEngine() {
  if (hapticEngine) return Promise.resolve(hapticEngine);
  if (enginePromise) return enginePromise;
  
  enginePromise = new Promise((resolve) => {
    const binaryPath = getHapticEnginePath();
    if (!existsSync(binaryPath)) {
      resetEngine();
      resolve(null);
      return;
    }
    
    const proc = spawn(binaryPath, [], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    
    let resolved = false;
    
    proc.once("spawn", () => {
      if (resolved) return;
      resolved = true;
      
      proc.stdin?.on("error", () => {});
      
      hapticEngine = {
        process: proc,
        write: (command) => {
          if (!proc.stdin || proc.stdin.destroyed) return false;
          try {
            proc.stdin.write(command + "\n");
            return true;
          } catch {
            return false;
          }
        },
      };
      
      resolve(hapticEngine);
    });
    
    proc.once("error", () => {
      resetEngine();
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });
    
    proc.once("exit", () => {
      resetEngine();
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });
  });
  
  return enginePromise;
}

function parseHapticConfig(hapticConfig) {
  if (!hapticConfig || hapticConfig === false) {
    return null;
  }
  
  if (hapticConfig === true) {
    return { type: "success", intensity: DEFAULT_INTENSITY.success };
  }
  
  if (typeof hapticConfig === "string") {
    return { type: hapticConfig, intensity: DEFAULT_INTENSITY[hapticConfig] || 1.0 };
  }
  
  if (typeof hapticConfig === "object") {
    const type = hapticConfig.type || "success";
    const intensity = hapticConfig.intensity ?? DEFAULT_INTENSITY[type] ?? 1.0;
    return { type, intensity };
  }
  
  return null;
}

async function playHaptic(hapticConfig) {
  if (process.platform !== "darwin") return;
  
  const parsed = parseHapticConfig(hapticConfig);
  if (!parsed) return;
  
  const engine = await getHapticEngine();
  if (!engine) return;
  
  const actuationID = HAPTIC_ACTUATION_MAP[parsed.type] || ACTUATION_STRONG;
  const rawIntensity = parsed.intensity;
  const intensity = Number.isFinite(rawIntensity) ? Math.max(0, Math.min(2, rawIntensity)) : 1.0;
  const command = `${actuationID},${intensity}`;
  
  const success = engine.write(command);
  if (!success) {
    resetEngine();
  }
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
    await playHaptic(config.haptic);
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
    
    // Debug log to file
    const fs = await import("node:fs/promises");
    const debugLog = `${homedir()}/.louder-debug.log`;
    const timestamp = new Date().toISOString();
    await fs.appendFile(debugLog, `[${timestamp}] Event: ${hookInput.hook_event_name}\n`);
    
    await handleHook(hookInput);
    
    await fs.appendFile(debugLog, `[${timestamp}] Handled\n`);
    process.exit(0);
  } catch (e) {
    // Debug error
    const fs = await import("node:fs/promises");
    const debugLog = `${homedir()}/.louder-debug.log`;
    await fs.appendFile(debugLog, `[${new Date().toISOString()}] Error: ${e.message}\n`).catch(() => {});
    process.exit(0);
  }
}

main();
