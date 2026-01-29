export {
  createNotifier,
  sendTaskCompleteNotification,
  sendErrorNotification,
  sendProgressNotification,
  type NotifierConfig,
  type Notifier,
} from "./notifier"

export {
  sendNotification,
  type NotificationOptions,
} from "./notification"

export {
  playSound,
  resolveSoundType,
  type SoundType,
  type SoundOptions,
} from "./sound"

export {
  playHaptic,
  resolveHapticType,
  type HapticType,
  type HapticOptions,
} from "./haptic"

export {
  detectPlatform,
  type Platform,
} from "./platform"
