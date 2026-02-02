import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { access, constants } from "node:fs/promises"
import { detectPlatform, type Platform } from "./platform"

const execFileAsync = promisify(execFile)

const DEBUG = process.env.DEBUG === "louder" || process.env.DEBUG === "*"

function debug(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.error(`[louder:sound] ${message}`, ...args)
  }
}

export type SoundType = 
  | "success"
  | "info"
  | "warning"
  | "error"
  | "progress"
  | "reminder"
  | "default"
  | "silent"

export interface SoundOptions {
  soundType?: SoundType
  soundPath?: string
  platform?: Platform
}

const MACOS_SOUNDS: Record<SoundType, string> = {
  success: "/System/Library/Sounds/Glass.aiff",
  info: "/System/Library/Sounds/Blow.aiff",
  warning: "/System/Library/Sounds/Sosumi.aiff",
  error: "/System/Library/Sounds/Basso.aiff",
  progress: "/System/Library/Sounds/Tink.aiff",
  reminder: "/System/Library/Sounds/Ping.aiff",
  default: "/System/Library/Sounds/Glass.aiff",
  silent: "",
}

function getSoundPath(soundType: SoundType, platform: Platform): string {
  if (platform === "darwin") {
    return MACOS_SOUNDS[soundType]
  }
  return ""
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK)
    return true
  } catch {
    return false
  }
}

const SOUND_TIMEOUT_MS = 4000

async function playDarwinSound(soundPath: string): Promise<void> {
  await execFileAsync('afplay', [soundPath], { timeout: SOUND_TIMEOUT_MS })
}

export async function playSound(options: SoundOptions = {}): Promise<boolean> {
  const currentPlatform = options.platform ?? detectPlatform()
  const soundType = options.soundType ?? "default"

  debug("playSound called", { soundType, platform: currentPlatform })

  if (soundType === "silent") {
    debug("sound type is silent, skipping")
    return true
  }

  const soundPath = options.soundPath ?? getSoundPath(soundType, currentPlatform)

  if (!soundPath || currentPlatform === "unsupported") {
    debug("unsupported platform or empty soundPath", { soundPath, platform: currentPlatform })
    return false
  }

  const exists = await fileExists(soundPath)
  if (!exists) {
    debug("sound file not found", { soundPath })
    return false
  }

  try {
    if (currentPlatform === "darwin") {
      debug("playing sound via afplay", { soundPath })
      await playDarwinSound(soundPath)
      debug("sound played successfully")
      return true
    }
    return false
  } catch (error) {
    debug("failed to play sound", { error })
    return false
  }
}

export function resolveSoundType(value: boolean | SoundType | undefined, defaultType: SoundType): SoundType | null {
  if (value === false) return null
  if (value === true || value === undefined) return defaultType
  return value
}
