import { describe, test, expect } from "vitest"
import { resolveSoundType, type SoundType } from "./sound"

describe("resolveSoundType", () => {
  test("should return null when value is false", () => {
    const result = resolveSoundType(false, "success")
    expect(result).toBeNull()
  })

  test("should return default type when value is true", () => {
    const result = resolveSoundType(true, "success")
    expect(result).toBe("success")
  })

  test("should return default type when value is undefined", () => {
    const result = resolveSoundType(undefined, "error")
    expect(result).toBe("error")
  })

  test("should return the value when it is a SoundType", () => {
    const result = resolveSoundType("warning" as SoundType, "success")
    expect(result).toBe("warning")
  })

  test("should handle all sound types", () => {
    const soundTypes: SoundType[] = [
      "success",
      "info",
      "warning",
      "error",
      "progress",
      "reminder",
      "default",
      "silent",
    ]
    
    for (const soundType of soundTypes) {
      const result = resolveSoundType(soundType, "default")
      expect(result).toBe(soundType)
    }
  })
})
