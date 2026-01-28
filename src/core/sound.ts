import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { access, constants } from "node:fs/promises"
import { detectPlatform, type Platform } from "./platform"

const execFileAsync = promisify(execFile)

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

async function playDarwinSound(soundPath: string): Promise<void> {
  await execFileAsync('afplay', [soundPath])
}

export async function playSound(options: SoundOptions = {}): Promise<boolean> {
  const currentPlatform = options.platform ?? detectPlatform()
  const soundType = options.soundType ?? "default"

  if (soundType === "silent") {
    return true
  }

  const soundPath = options.soundPath ?? getSoundPath(soundType, currentPlatform)

  if (!soundPath || currentPlatform === "unsupported") {
    return false
  }

  const exists = await fileExists(soundPath)
  if (!exists) {
    return false
  }

  try {
    if (currentPlatform === "darwin") {
      await playDarwinSound(soundPath)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function resolveSoundType(value: boolean | SoundType | undefined, defaultType: SoundType): SoundType | null {
  if (value === false) return null
  if (value === true || value === undefined) return defaultType
  return value
}
