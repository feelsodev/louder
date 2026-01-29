import { detectPlatform, type Platform } from "./platform"

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
      return hapticFeedbackInstance
    } catch {
      return null
    }
  })()

  return instancePromise
}

export async function playHaptic(options: InternalHapticOptions = {}): Promise<boolean> {
  const currentPlatform = options.platform ?? detectPlatform()
  const hapticType = options.hapticType ?? "success"

  if (hapticType === "silent") {
    return true
  }

  if (currentPlatform !== "darwin") {
    return false
  }

  try {
    const instance = await getHapticFeedbackInstance()
    if (!instance) {
      return false
    }

    const pattern = HAPTIC_PATTERN_MAP[hapticType]
    instance.trigger(pattern)
    return true
  } catch {
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
