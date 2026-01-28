import { createNotifier } from "../core/notifier"
import { resolveSoundType, type SoundType } from "../core/sound"
import { loadConfig, type EchoEvent } from "../config"

export interface ClaudeHookInput {
  session_id: string
  transcript_path: string
  cwd: string
  hook_event_name: string
  notification_type?: string
}

export type ClaudeHookEvent = "Stop" | "Notification"

const EVENT_DEFAULTS: Record<ClaudeHookEvent, { echoEvent: EchoEvent; soundType: SoundType }> = {
  Stop: { echoEvent: "stop", soundType: "success" },
  Notification: { echoEvent: "notification", soundType: "info" },
}

export async function handleClaudeHook(input: ClaudeHookInput): Promise<void> {
  const config = await loadConfig(input.cwd)
  const hookEvent = input.hook_event_name as ClaudeHookEvent

  const defaults = EVENT_DEFAULTS[hookEvent]
  if (!defaults) return

  const eventConfig = config.events?.[defaults.echoEvent]
  if (eventConfig === false) return

  const soundType = resolveSoundType(
    eventConfig ?? config.sound,
    defaults.soundType
  )

  const notifierConfig = {
    title: config.title ?? "Louder",
    message: config.message ?? "Claude Code is ready",
    subtitle: config.subtitle,
    open: config.open,
    sound: soundType ?? false,
    delay: 0,
    ...(config.soundPath ? { soundPath: config.soundPath } : {}),
  }

  const notifier = createNotifier(notifierConfig)
  await notifier.trigger()
}

export function createClaudeHooksJson(): object {
  return {
    hooks: {
      Stop: [
        {
          hooks: [
            {
              type: "command",
              command: "npx @feelso/louder",
              timeout: 5000,
            },
          ],
        },
      ],
      Notification: [
        {
          matcher: ".*",
          hooks: [
            {
              type: "command",
              command: "npx @feelso/louder",
              timeout: 5000,
            },
          ],
        },
      ],
    },
  }
}
