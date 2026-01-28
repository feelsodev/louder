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

const LINUX_SOUNDS: Record<SoundType, string> = {
  success: "/usr/share/sounds/freedesktop/stereo/complete.oga",
  info: "/usr/share/sounds/freedesktop/stereo/dialog-information.oga",
  warning: "/usr/share/sounds/freedesktop/stereo/dialog-warning.oga",
  error: "/usr/share/sounds/freedesktop/stereo/dialog-error.oga",
  progress: "/usr/share/sounds/freedesktop/stereo/message.oga",
  reminder: "/usr/share/sounds/freedesktop/stereo/bell.oga",
  default: "/usr/share/sounds/freedesktop/stereo/complete.oga",
  silent: "",
}

const WINDOWS_SOUNDS: Record<SoundType, string> = {
  success: "C:\\Windows\\Media\\tada.wav",
  info: "C:\\Windows\\Media\\Windows Background.wav",
  warning: "C:\\Windows\\Media\\Windows Exclamation.wav",
  error: "C:\\Windows\\Media\\Windows Critical Stop.wav",
  progress: "C:\\Windows\\Media\\Windows Notify System Generic.wav",
  reminder: "C:\\Windows\\Media\\notify.wav",
  default: "C:\\Windows\\Media\\notify.wav",
  silent: "",
}

function getSoundPath(soundType: SoundType, platform: Platform): string {
  switch (platform) {
    case "darwin":
      return MACOS_SOUNDS[soundType]
    case "linux":
      return LINUX_SOUNDS[soundType]
    case "win32":
      return WINDOWS_SOUNDS[soundType]
    default:
      return ""
  }
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

async function playLinuxSound(soundPath: string): Promise<void> {
  try {
    await execFileAsync('paplay', [soundPath])
  } catch {
    await execFileAsync('aplay', [soundPath])
  }
}

async function playWindowsSound(soundPath: string): Promise<void> {
  const script = `(New-Object Media.SoundPlayer '${soundPath.replace(/'/g, "''")}').PlaySync()`
  await execFileAsync('powershell', ['-NoProfile', '-Command', script])
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
    switch (currentPlatform) {
      case "darwin":
        await playDarwinSound(soundPath)
        return true
      case "linux":
        await playLinuxSound(soundPath)
        return true
      case "win32":
        await playWindowsSound(soundPath)
        return true
      default:
        return false
    }
  } catch {
    return false
  }
}

export function resolveSoundType(value: boolean | SoundType | undefined, defaultType: SoundType): SoundType | null {
  if (value === false) return null
  if (value === true || value === undefined) return defaultType
  return value
}
