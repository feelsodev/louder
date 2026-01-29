import { playSound, resolveSoundType, type SoundType } from "./sound"
import { playHaptic, type HapticType } from "./haptic"
import { detectPlatform, type Platform } from "./platform"

export interface HapticConfigObject {
  type?: HapticType
  intensity?: number
}

function resolveHapticConfig(
  value: boolean | HapticType | HapticConfigObject | undefined
): { hapticType: HapticType; intensity?: number } | null {
  if (value === false) return null
  if (value === undefined || value === true) return { hapticType: "success" }
  if (typeof value === "string") return { hapticType: value }
  if (typeof value === "object") {
    return { hapticType: value.type ?? "success", intensity: value.intensity }
  }
  return null
}

export interface NotifierConfig {
  sound?: boolean | SoundType
  soundPath?: string
  haptic?: boolean | HapticType | HapticConfigObject
  delay?: number
}

export interface Notifier {
  trigger: (overrides?: Partial<NotifierConfig>) => Promise<void>
  cancel: () => void
  platform: Platform
}

const DEFAULT_CONFIG: Required<Omit<NotifierConfig, "soundPath">> & {
  soundPath?: string
} = {
  sound: true,
  soundPath: undefined,
  haptic: false,
  delay: 1500,
}

export function createNotifier(config: NotifierConfig = {}): Notifier {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const platform = detectPlatform()

  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingResolve: (() => void) | null = null
  let cancelled = false

  async function execute(
    overrides: Partial<NotifierConfig> = {}
  ): Promise<void> {
    if (cancelled) return

    const finalConfig = { ...mergedConfig, ...overrides }

    const soundType = resolveSoundType(finalConfig.sound, "success")
    if (soundType) {
      const soundOptions = finalConfig.soundPath
        ? { soundType, soundPath: finalConfig.soundPath, platform }
        : { soundType, platform }
      await playSound(soundOptions)
    }

    const hapticOptions = resolveHapticConfig(finalConfig.haptic)
    if (hapticOptions) {
      await playHaptic({ ...hapticOptions, platform })
    }
  }

  return {
    trigger: async (overrides?: Partial<NotifierConfig>) => {
      cancelled = false
      pendingResolve = null

      if (mergedConfig.delay > 0) {
        return new Promise<void>((resolve) => {
          pendingResolve = resolve
          pendingTimer = setTimeout(() => {
            pendingResolve = null
            execute(overrides)
              .catch(() => {})
              .finally(() => resolve())
          }, mergedConfig.delay)
        })
      }

      await execute(overrides)
    },

    cancel: () => {
      cancelled = true
      if (pendingTimer) {
        clearTimeout(pendingTimer)
        pendingTimer = null
      }
      if (pendingResolve) {
        pendingResolve()
        pendingResolve = null
      }
    },

    platform,
  }
}
