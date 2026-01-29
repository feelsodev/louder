import { spawn, type ChildProcess } from "child_process"
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

const ACTUATION_STRONG = 6
const ACTUATION_WEAK = 3

const HAPTIC_ACTUATION_MAP: Record<HapticType, number> = {
  success: ACTUATION_STRONG,
  error: ACTUATION_WEAK,
}

const DEFAULT_INTENSITY: Record<HapticType, number> = {
  success: 1.0,
  error: 0.6,
}

interface HapticEngineProcess {
  process: ChildProcess
  write: (command: string) => boolean
}

let hapticEngine: HapticEngineProcess | null = null
let enginePromise: Promise<HapticEngineProcess | null> | null = null

function getNativeBinaryPath(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  return join(currentDir, "..", "..", "native", "HapticEngine")
}

function resetEngine(): void {
  hapticEngine = null
  enginePromise = null
}

async function getHapticEngine(): Promise<HapticEngineProcess | null> {
  if (hapticEngine) {
    return hapticEngine
  }

  if (enginePromise) {
    return enginePromise
  }

  enginePromise = new Promise((resolve) => {
    const binaryPath = getNativeBinaryPath()
    
    if (!existsSync(binaryPath)) {
      debug("haptic binary not found", { binaryPath })
      resetEngine()
      resolve(null)
      return
    }

    debug("spawning haptic engine", { binaryPath })

    const proc = spawn(binaryPath, [], {
      stdio: ["pipe", "ignore", DEBUG ? "inherit" : "ignore"],
    })

    let resolved = false

    proc.once("spawn", () => {
      if (resolved) return
      resolved = true

      proc.stdin?.on("error", (err) => {
        debug("stdin error", { error: err.message })
      })

      hapticEngine = {
        process: proc,
        write: (command: string): boolean => {
          if (!proc.stdin || proc.stdin.destroyed) {
            return false
          }
          try {
            proc.stdin.write(command + "\n")
            return true
          } catch {
            return false
          }
        },
      }

      debug("haptic engine started", { pid: proc.pid })
      resolve(hapticEngine)
    })

    proc.once("error", (err) => {
      debug("haptic engine error", { error: err.message })
      resetEngine()
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    })

    proc.once("exit", (code) => {
      debug("haptic engine exited", { code })
      resetEngine()
      if (!resolved) {
        resolved = true
        resolve(null)
      }
    })
  })

  return enginePromise
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
    const engine = await getHapticEngine()
    if (!engine) {
      debug("haptic engine not available")
      return false
    }

    const actuationID = HAPTIC_ACTUATION_MAP[hapticType]
    const rawIntensity = options.intensity ?? DEFAULT_INTENSITY[hapticType]
    const intensity = Number.isFinite(rawIntensity) ? Math.max(0, Math.min(2, rawIntensity)) : 1.0
    const command = `${actuationID},${intensity}`

    debug("triggering haptic", { actuationID, intensity, command })
    const success = engine.write(command)
    
    if (!success) {
      debug("failed to write to haptic engine, resetting")
      resetEngine()
      return false
    }
    
    debug("haptic triggered successfully")
    return true
  } catch (error) {
    debug("failed to trigger haptic", { error })
    resetEngine()
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
