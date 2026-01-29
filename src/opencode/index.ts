import { createNotifier, type Notifier } from "../core/notifier"
import { resolveSoundType, type SoundType } from "../core/sound"
import { loadConfig, type EchoConfig, type EchoEvent } from "../config"

const MAX_SESSIONS = 100

function createLRUSet(maxSize: number = MAX_SESSIONS) {
  const map = new Map<string, number>()

  return {
    add(key: string) {
      if (map.has(key)) {
        map.delete(key)
      }
      map.set(key, Date.now())

      if (map.size > maxSize) {
        const oldest = map.keys().next().value
        if (oldest) map.delete(oldest)
      }
    },
    has(key: string): boolean {
      return map.has(key)
    },
    delete(key: string): boolean {
      return map.delete(key)
    },
    clear() {
      map.clear()
    },
  }
}

export interface OpenCodeEvent {
  type: string
  properties?: Record<string, unknown>
}

export interface OpenCodePluginInput {
  directory: string
}

export interface OpenCodePlugin {
  event: (input: { event: OpenCodeEvent }) => Promise<void>
}

type OpenCodeEventType = "session.idle" | "session.error" | "session.progress"

const EVENT_DEFAULTS: Record<OpenCodeEventType, { echoEvent: EchoEvent; soundType: SoundType }> = {
  "session.idle": { echoEvent: "idle", soundType: "reminder" },
  "session.error": { echoEvent: "error", soundType: "error" },
  "session.progress": { echoEvent: "progress", soundType: "progress" },
}

function getEventSoundType(
  eventType: OpenCodeEventType,
  config: EchoConfig
): SoundType | null {
  const defaults = EVENT_DEFAULTS[eventType]
  if (!defaults) return null

  const eventConfig = config.events?.[defaults.echoEvent]
  if (eventConfig === false) return null

  return resolveSoundType(eventConfig ?? config.sound, defaults.soundType)
}

export async function createOpenCodePlugin(ctx: OpenCodePluginInput): Promise<OpenCodePlugin> {
  const config = await loadConfig(ctx.directory)

  const notifierConfig = {
    sound: config.sound ?? true,
    haptic: config.haptic,
    delay: config.delay ?? 1500,
    ...(config.soundPath ? { soundPath: config.soundPath } : {}),
  }

  const notifier: Notifier = createNotifier(notifierConfig)

  const notifiedSessions = createLRUSet()
  const activitySessions = createLRUSet()

  function markActivity(sessionID: string) {
    activitySessions.add(sessionID)
    notifier.cancel()
    notifiedSessions.delete(sessionID)
  }

  async function handleNotification(
    sessionID: string,
    eventType: OpenCodeEventType
  ) {
    if (notifiedSessions.has(sessionID)) return

    const soundType = getEventSoundType(eventType, config)
    if (soundType === null) return

    if (activitySessions.has(sessionID)) {
      activitySessions.delete(sessionID)
      return
    }

    notifiedSessions.add(sessionID)

    await notifier.trigger({
      sound: soundType,
    })
  }

  return {
    event: async ({ event }) => {
      try {
        const props = event.properties as Record<string, unknown> | undefined

        if (event.type === "session.updated" || event.type === "message.updated") {
          const info = props?.info as Record<string, unknown> | undefined
          const sessionID = (info?.id ?? info?.sessionID ?? props?.sessionID) as string | undefined
          if (sessionID) {
            markActivity(sessionID)
          }
          return
        }

        if (event.type === "session.idle") {
          const sessionID = props?.sessionID as string | undefined
          if (!sessionID) return
          await handleNotification(sessionID, "session.idle")
        }

        if (event.type === "session.error") {
          const sessionID = props?.sessionID as string | undefined
          if (!sessionID) return
          await handleNotification(sessionID, "session.error")
        }

        if (event.type === "session.progress") {
          const sessionID = props?.sessionID as string | undefined
          if (!sessionID) return
          await handleNotification(sessionID, "session.progress")
        }
      } catch {}
    },
  }
}

export const echoPlugin = async (ctx: OpenCodePluginInput) => {
  return createOpenCodePlugin(ctx)
}
