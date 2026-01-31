import { createRequire } from "node:module"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { existsSync } from "fs"
import { detectPlatform, type Platform } from "./platform"

const DEBUG = process.env.DEBUG === "louder" || process.env.DEBUG === "*"

function debug(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.error(`[louder:haptic] ${message}`, ...args)
  }
}

export type HapticType = "success" | "error"

type InternalHapticType = HapticType | "silent"

export interface HapticOptions {
  hapticType?: HapticType
  intensity?: number
  platform?: Platform
}

interface InternalHapticOptions {
  hapticType?: InternalHapticType
  intensity?: number
  platform?: Platform
}

interface NativeModule {
  actuate: (actuation: number, intensity: number) => void
  isSupported?: () => boolean
}

let nativeModule: NativeModule | null = null
let moduleLoaded = false

function loadNativeModule(): NativeModule | null {
  if (moduleLoaded) return nativeModule
  moduleLoaded = true

  if (process.platform !== "darwin") {
    debug("not darwin, skipping native module load")
    return null
  }

  const currentDir = dirname(fileURLToPath(import.meta.url))
  const modulePath = join(currentDir, "..", "native", "vibe-haptic-native.node")

  if (!existsSync(modulePath)) {
    debug("native module not found", { modulePath })
    return null
  }

  try {
    const require = createRequire(import.meta.url)
    nativeModule = require(modulePath) as NativeModule
    debug("native module loaded", { modulePath })
    return nativeModule
  } catch (error) {
    debug("failed to load native module", { error })
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function playHaptic(options: InternalHapticOptions = {}): Promise<boolean> {
  const currentPlatform = options.platform ?? detectPlatform()
  const hapticType = options.hapticType ?? "success"

  debug("playHaptic called", { hapticType, intensity: options.intensity, platform: currentPlatform })

  if (hapticType === "silent") {
    debug("haptic type is silent, skipping")
    return true
  }

  if (currentPlatform !== "darwin") {
    debug("unsupported platform for haptic", { platform: currentPlatform })
    return false
  }

  try {
    const native = loadNativeModule()
    if (!native) {
      debug("native module not available")
      return false
    }

    debug("triggering haptic pattern", { hapticType })
    
    if (hapticType === "success") {
      native.actuate(6, 0.8)
      await sleep(100)
      native.actuate(3, 1.0)
      await sleep(300)
      native.actuate(6, 1.0)
    } else {
      native.actuate(6, 0.5)
      await sleep(100)
      native.actuate(6, 1.0)
      await sleep(100)
      native.actuate(6, 0.5)
    }
    
    debug("haptic triggered successfully")
    return true
  } catch (error) {
    debug("failed to trigger haptic", { error })
    return false
  }
}

export function resolveHapticType(
  value: boolean | HapticType | undefined,
  defaultType: HapticType
): HapticType | null {
  if (value === false) return null
  if (value === true || value === undefined) return defaultType
  return value
}
