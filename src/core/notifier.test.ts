import { describe, test, expect, vi, beforeEach } from "vitest"
import { createNotifier } from "./notifier"

vi.mock("./sound", () => ({
  playSound: vi.fn().mockResolvedValue(true),
  resolveSoundType: vi.fn((value, defaultType) => {
    if (value === false) return null
    if (value === true || value === undefined) return defaultType
    return value
  }),
}))

vi.mock("./haptic", () => ({
  playHaptic: vi.fn().mockResolvedValue(true),
  resolveHapticType: vi.fn((value, defaultType) => {
    if (value === false) return null
    if (value === true || value === undefined) return defaultType
    return value
  }),
}))

describe("createNotifier", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should create a notifier with default config", () => {
    const notifier = createNotifier()
    expect(notifier).toBeDefined()
    expect(notifier.trigger).toBeInstanceOf(Function)
    expect(notifier.cancel).toBeInstanceOf(Function)
    expect(notifier.platform).toBeDefined()
  })

  test("should create a notifier with custom config", () => {
    const notifier = createNotifier({
      sound: false,
      delay: 0,
    })
    expect(notifier).toBeDefined()
  })

  test("should create a notifier with SoundType", () => {
    const notifier = createNotifier({
      sound: "success",
    })
    expect(notifier).toBeDefined()
  })

  test("should create a notifier with haptic enabled", () => {
    const notifier = createNotifier({
      haptic: true,
    })
    expect(notifier).toBeDefined()
  })

  test("should cancel pending trigger and resolve immediately", async () => {
    const notifier = createNotifier({ delay: 5000 })

    const triggerPromise = notifier.trigger()
    notifier.cancel()

    const result = await Promise.race([
      triggerPromise.then(() => "resolved"),
      new Promise<string>((resolve) =>
        setTimeout(() => resolve("timeout"), 100)
      ),
    ])

    expect(result).toBe("resolved")
  })
})
