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
  platform?: Platform
}

interface InternalHapticOptions {
  hapticType?: InternalHapticType
  platform?: Platform
}

type HapticPattern = "levelChange" | "generic" | "alignment"

const HAPTIC_PATTERN_MAP: Record<HapticType, HapticPattern> = {
  success: "levelChange",
  error: "generic",
}

interface HapticFeedbackInstance {
  trigger: (pattern?: HapticPattern) => void
}

let hapticFeedbackInstance: HapticFeedbackInstance | null = null
let instancePromise: Promise<HapticFeedbackInstance | null> | null = null

async function getHapticFeedbackInstance(): Promise<HapticFeedbackInstance | null> {
  if (hapticFeedbackInstance) {
    return hapticFeedbackInstance
  }

  if (instancePromise) {
    return instancePromise
  }

  instancePromise = (async () => {
    try {
      const module = await import("haptic-feedback-swift")
      const HapticFeedback = module.HapticFeedback as new () => HapticFeedbackInstance
      hapticFeedbackInstance = new HapticFeedback()
      debug("haptic-feedback-swift loaded successfully")
      return hapticFeedbackInstance
    } catch (error) {
      debug("haptic-feedback-swift not available", { error })
      return null
    }
  })()

  return instancePromise
}

export async function playHaptic(options: InternalHapticOptions = {}): Promise<boolean> {
  const currentPlatform = options.platform ?? detectPlatform()
  const hapticType = options.hapticType ?? "success"

  debug("playHaptic called", { hapticType, platform: currentPlatform })

  if (hapticType === "silent") {
    debug("haptic type is silent, skipping")
    return true
  }

  if (currentPlatform !== "darwin") {
    debug("unsupported platform for haptic", { platform: currentPlatform })
    return false
  }

  try {
    const instance = await getHapticFeedbackInstance()
    if (!instance) {
      debug("haptic instance not available")
      return false
    }

    const pattern = HAPTIC_PATTERN_MAP[hapticType]
    debug("triggering haptic", { pattern })
    instance.trigger(pattern)
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
