import { createNotifier, type Notifier } from "../core/notifier"
import { resolveSoundType, type SoundType } from "../core/sound"
import { loadConfig, type EchoConfig, type EchoEvent } from "../config"

const DEBUG = process.env.DEBUG === "louder" || process.env.DEBUG === "*"

function debug(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.error(`[louder:opencode] ${message}`, ...args)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function extractSessionID(props: Record<string, unknown> | undefined): string | undefined {
  if (!props) return undefined

  if (isString(props.sessionID)) {
    return props.sessionID
  }

  const info = props.info
  if (isRecord(info)) {
    if (isString(info.id)) return info.id
    if (isString(info.sessionID)) return info.sessionID
  }

  return undefined
}

const MAX_SESSIONS = 100

function createLRUSet(maxSize: number = MAX_SESSIONS) {
  const set = new Set<string>()

  return {
    add(key: string) {
      if (set.has(key)) {
        set.delete(key)
      }
      set.add(key)

      if (set.size > maxSize) {
        const oldest = set.values().next().value
        if (oldest) set.delete(oldest)
      }
    },
    has(key: string): boolean {
      return set.has(key)
    },
    delete(key: string): boolean {
      return set.delete(key)
    },
    clear() {
      set.clear()
    },
  }
}

export interface OpenCodeEvent {
  type: string
  properties?: unknown
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
        const props = isRecord(event.properties) ? event.properties : undefined

        debug("received event", { type: event.type, props })

        if (event.type === "session.updated" || event.type === "message.updated") {
          const sessionID = extractSessionID(props)
          if (sessionID) {
            debug("marking activity for session", { sessionID })
            markActivity(sessionID)
          }
          return
        }

        if (event.type === "session.idle") {
          const sessionID = extractSessionID(props)
          if (!sessionID) return
          debug("handling session.idle", { sessionID })
          await handleNotification(sessionID, "session.idle")
        }

        if (event.type === "session.error") {
          const sessionID = extractSessionID(props)
          if (!sessionID) return
          debug("handling session.error", { sessionID })
          await handleNotification(sessionID, "session.error")
        }

        if (event.type === "session.progress") {
          const sessionID = extractSessionID(props)
          if (!sessionID) return
          debug("handling session.progress", { sessionID })
          await handleNotification(sessionID, "session.progress")
        }
      } catch (error) {
        debug("error handling event", { error })
      }
    },
  }
}

export const echoPlugin = async (ctx: OpenCodePluginInput) => {
  return createOpenCodePlugin(ctx)
}
