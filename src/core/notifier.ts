import { sendNotification } from "./notification"
import { playSound, resolveSoundType, type SoundType } from "./sound"
import { detectPlatform, type Platform } from "./platform"

export interface NotifierConfig {
  title?: string
  message?: string
  subtitle?: string
  open?: string
  sound?: boolean | SoundType
  soundPath?: string
  delay?: number
}

export interface Notifier {
  trigger: (overrides?: Partial<NotifierConfig>) => Promise<void>
  cancel: () => void
  platform: Platform
  sendTaskComplete: (task: string, details?: string) => Promise<void>
  sendError: (error: string, details?: string) => Promise<void>
  sendProgress: (status: string, details?: string) => Promise<void>
  sendCustom: (options: NotifierConfig) => Promise<void>
}

const DEFAULT_CONFIG: Required<Omit<NotifierConfig, "soundPath" | "subtitle" | "open">> & {
  soundPath?: string
  subtitle?: string
  open?: string
} = {
  title: "Louder",
  message: "Task completed",
  subtitle: undefined,
  open: undefined,
  sound: true,
  soundPath: undefined,
  delay: 1500,
}

export function createNotifier(config: NotifierConfig = {}): Notifier {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const platform = detectPlatform()

  let pendingTimer: ReturnType<typeof setTimeout> | null = null
  let pendingResolve: (() => void) | null = null
  let cancelled = false

  async function executeNotification(
    overrides: Partial<NotifierConfig> = {}
  ): Promise<void> {
    if (cancelled) return

    const finalConfig = { ...mergedConfig, ...overrides }

    const sent = await sendNotification({
      title: finalConfig.title,
      message: finalConfig.message,
      subtitle: finalConfig.subtitle,
      open: finalConfig.open,
      platform,
    })

    if (sent) {
      const soundType = resolveSoundType(finalConfig.sound, "success")
      if (soundType) {
        const soundOptions = finalConfig.soundPath
          ? { soundType, soundPath: finalConfig.soundPath, platform }
          : { soundType, platform }
        await playSound(soundOptions)
      }
    }
  }

  return {
    trigger: async (overrides?: Partial<NotifierConfig>) => {
      cancelled = false
      pendingResolve = null

      if (mergedConfig.delay > 0) {
        return new Promise<void>((resolve) => {
          pendingResolve = resolve
          pendingTimer = setTimeout(async () => {
            pendingResolve = null
            await executeNotification(overrides)
            resolve()
          }, mergedConfig.delay)
        })
      }

      await executeNotification(overrides)
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

    sendTaskComplete: async (task: string, details?: string) => {
      cancelled = false
      await executeNotification({
        title: "Task Complete",
        message: task,
        subtitle: details,
        sound: "success",
      })
    },

    sendError: async (error: string, details?: string) => {
      cancelled = false
      await executeNotification({
        title: "Error",
        message: error,
        subtitle: details,
        sound: "error",
      })
    },

    sendProgress: async (status: string, details?: string) => {
      cancelled = false
      await executeNotification({
        title: "Progress",
        message: status,
        subtitle: details,
        sound: "progress",
      })
    },

    sendCustom: async (options: NotifierConfig) => {
      cancelled = false
      await executeNotification(options)
    },

    platform,
  }
}

export async function sendTaskCompleteNotification(
  task: string,
  details?: string,
  config: NotifierConfig = {}
): Promise<void> {
  const notifier = createNotifier({ ...config, delay: 0 })
  await notifier.sendTaskComplete(task, details)
}

export async function sendErrorNotification(
  error: string,
  details?: string,
  config: NotifierConfig = {}
): Promise<void> {
  const notifier = createNotifier({ ...config, delay: 0 })
  await notifier.sendError(error, details)
}

export async function sendProgressNotification(
  status: string,
  details?: string,
  config: NotifierConfig = {}
): Promise<void> {
  const notifier = createNotifier({ ...config, delay: 0 })
  await notifier.sendProgress(status, details)
}
