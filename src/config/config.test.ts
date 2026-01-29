import { describe, test, expect } from "vitest"
import { EchoConfigSchema, SoundTypeSchema, HapticTypeSchema, HapticConfigSchema } from "./index"

describe("EchoConfigSchema", () => {
  test("should validate empty config", () => {
    const result = EchoConfigSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  test("should validate full config", () => {
    const result = EchoConfigSchema.safeParse({
      sound: true,
      soundPath: "/path/to/sound.aiff",
      haptic: true,
      delay: 2000,
      events: {
        stop: true,
        notification: false,
        idle: true,
        error: false,
        progress: true,
      },
    })
    expect(result.success).toBe(true)
  })

  test("should validate sound as SoundType", () => {
    const result = EchoConfigSchema.safeParse({
      sound: "success",
    })
    expect(result.success).toBe(true)
  })

  test("should validate haptic as HapticType", () => {
    const result = EchoConfigSchema.safeParse({
      haptic: "error",
    })
    expect(result.success).toBe(true)
  })

  test("should validate events with SoundType", () => {
    const result = EchoConfigSchema.safeParse({
      events: {
        stop: "success",
        error: "error",
        idle: "reminder",
        progress: "progress",
      },
    })
    expect(result.success).toBe(true)
  })

  test("should reject negative delay", () => {
    const result = EchoConfigSchema.safeParse({
      delay: -100,
    })
    expect(result.success).toBe(false)
  })

  test("should reject invalid sound type", () => {
    const result = EchoConfigSchema.safeParse({
      sound: "invalid-sound",
    })
    expect(result.success).toBe(false)
  })

  test("should reject invalid haptic type", () => {
    const result = EchoConfigSchema.safeParse({
      haptic: "invalid-haptic",
    })
    expect(result.success).toBe(false)
  })
})

describe("SoundTypeSchema", () => {
  test("should validate all sound types", () => {
    const validTypes = [
      "success",
      "info",
      "warning",
      "error",
      "progress",
      "reminder",
      "default",
      "silent",
    ]

    for (const type of validTypes) {
      const result = SoundTypeSchema.safeParse(type)
      expect(result.success).toBe(true)
    }
  })

  test("should reject invalid sound type", () => {
    const result = SoundTypeSchema.safeParse("invalid")
    expect(result.success).toBe(false)
  })
})

describe("HapticTypeSchema", () => {
  test("should validate all haptic types", () => {
    const validTypes = ["success", "error"]

    for (const type of validTypes) {
      const result = HapticTypeSchema.safeParse(type)
      expect(result.success).toBe(true)
    }
  })

  test("should reject invalid haptic type", () => {
    const result = HapticTypeSchema.safeParse("invalid")
    expect(result.success).toBe(false)
  })
})

describe("HapticConfigSchema", () => {
  test("should validate haptic config with type and intensity", () => {
    const result = HapticConfigSchema.safeParse({
      type: "success",
      intensity: 1.5,
    })
    expect(result.success).toBe(true)
  })

  test("should validate haptic config with only type", () => {
    const result = HapticConfigSchema.safeParse({
      type: "error",
    })
    expect(result.success).toBe(true)
  })

  test("should validate haptic config with only intensity", () => {
    const result = HapticConfigSchema.safeParse({
      intensity: 0.5,
    })
    expect(result.success).toBe(true)
  })

  test("should reject intensity above 2", () => {
    const result = HapticConfigSchema.safeParse({
      intensity: 2.5,
    })
    expect(result.success).toBe(false)
  })

  test("should reject negative intensity", () => {
    const result = HapticConfigSchema.safeParse({
      intensity: -0.5,
    })
    expect(result.success).toBe(false)
  })

  test("should validate in EchoConfigSchema", () => {
    const result = EchoConfigSchema.safeParse({
      haptic: {
        type: "success",
        intensity: 1.8,
      },
    })
    expect(result.success).toBe(true)
  })
})
