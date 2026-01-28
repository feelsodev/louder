export {
  createNotifier,
  sendTaskCompleteNotification,
  sendErrorNotification,
  sendProgressNotification,
  type NotifierConfig,
  type Notifier,
} from "./core/notifier"

export {
  sendNotification,
  type NotificationOptions,
} from "./core/notification"

export {
  playSound,
  resolveSoundType,
  type SoundType,
  type SoundOptions,
} from "./core/sound"

export {
  loadConfig,
  EchoConfigSchema,
  SoundTypeSchema,
  EventConfigSchema,
  type EchoConfig,
  type SoundTypeValue,
  type EventConfig,
  type EchoEvent,
} from "./config"

export {
  detectPlatform,
  type Platform,
} from "./core/platform"

export * as claude from "./claude"
export * as opencode from "./opencode"
