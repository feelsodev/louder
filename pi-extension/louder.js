import { execFile, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_CONFIG = {
  sound: true,
  haptic: false,
  events: {},
};

const SOUND_MAP = {
  success: "/System/Library/Sounds/Glass.aiff",
  error: "/System/Library/Sounds/Basso.aiff",
  info: "/System/Library/Sounds/Blow.aiff",
  warning: "/System/Library/Sounds/Sosumi.aiff",
  progress: "/System/Library/Sounds/Tink.aiff",
  reminder: "/System/Library/Sounds/Ping.aiff",
  default: "/System/Library/Sounds/Glass.aiff",
};

const HAPTIC_ACTUATION = {
  success: 6,
  error: 6,
};

let hapticEngine = null;
let enginePromise = null;

function readConfigFile(path) {
  if (!existsSync(path)) return {};

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function loadConfig() {
  return {
    ...DEFAULT_CONFIG,
    ...readConfigFile(join(homedir(), ".louderrc.json")),
    ...readConfigFile(join(process.cwd(), ".louderrc.json")),
  };
}

function getSoundType(eventName, config) {
  const eventConfig = config.events?.[eventName];
  if (eventConfig === false || config.sound === false) return null;
  if (typeof eventConfig === "string") return eventConfig;
  if (typeof config.sound === "string") return config.sound;
  return eventName === "error" ? "error" : "success";
}

async function playSound(soundType, soundPath) {
  if (!soundType || soundType === "silent") return;

  const path = soundPath || SOUND_MAP[soundType] || SOUND_MAP.default;
  try {
    await execFileAsync("afplay", [path], { timeout: 4000 });
  } catch {
    // Sound feedback must never interrupt the agent lifecycle.
  }
}

function resetHapticEngine() {
  hapticEngine = null;
  enginePromise = null;
}

function getHapticEnginePath() {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "native", "HapticEngine");
}

function getHapticEngine() {
  if (hapticEngine) return Promise.resolve(hapticEngine);
  if (enginePromise) return enginePromise;

  enginePromise = new Promise((resolve) => {
    const binaryPath = getHapticEnginePath();
    if (!existsSync(binaryPath)) {
      resetHapticEngine();
      resolve(null);
      return;
    }

    const process = spawn(binaryPath, [], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    let settled = false;

    process.once("spawn", () => {
      settled = true;
      process.stdin?.on("error", resetHapticEngine);
      hapticEngine = process;
      resolve(process);
    });

    process.once("error", () => {
      resetHapticEngine();
      if (!settled) resolve(null);
    });

    process.once("exit", () => {
      resetHapticEngine();
      if (!settled) resolve(null);
    });
  });

  return enginePromise;
}

function parseHapticConfig(hapticConfig, soundType) {
  if (!hapticConfig) return null;
  if (hapticConfig === true) return { type: soundType, intensity: 2 };
  if (typeof hapticConfig === "string") return { type: hapticConfig, intensity: 2 };
  if (typeof hapticConfig !== "object") return null;

  return {
    type: hapticConfig.type || soundType,
    intensity: hapticConfig.intensity ?? 2,
  };
}

async function playHaptic(hapticConfig, soundType) {
  if (process.platform !== "darwin") return;

  const parsed = parseHapticConfig(hapticConfig, soundType);
  if (!parsed) return;

  const engine = await getHapticEngine();
  if (!engine?.stdin || engine.stdin.destroyed) return;

  const actuation = HAPTIC_ACTUATION[parsed.type] || HAPTIC_ACTUATION.success;
  const intensity = Number.isFinite(parsed.intensity)
    ? Math.max(0, Math.min(2, parsed.intensity))
    : 1;

  engine.stdin.write(`burst,2,${actuation},${intensity},12000\n`);
}

async function notify(eventName) {
  const config = loadConfig();
  const soundType = getSoundType(eventName, config);

  await Promise.all([
    playSound(soundType, config.soundPath),
    playHaptic(config.haptic, eventName),
  ]);
}

function getCompletionType(event) {
  const finalAssistantMessage = event.messages
    ?.findLast((message) => message?.role === "assistant");

  if (
    finalAssistantMessage?.stopReason === "error"
    || finalAssistantMessage?.errorMessage
  ) {
    return "error";
  }

  return "success";
}

export function createLouderExtension(options = {}) {
  const sendNotification = options.notify || notify;

  return function louderExtension(pi) {
    let awaitingCompletion = true;

    pi.on("agent_start", () => {
      awaitingCompletion = true;
    });

    pi.on("agent_end", async (event) => {
      if (!awaitingCompletion) return;
      awaitingCompletion = false;
      await sendNotification(getCompletionType(event));
    });
  };
}

export default createLouderExtension();
