import { describe, test, expect } from "vitest"
import { resolveHapticType, type HapticType } from "./haptic"

describe("resolveHapticType", () => {
  test("should return null when value is false", () => {
    const result = resolveHapticType(false, "success")
    expect(result).toBeNull()
  })

  test("should return default type when value is true", () => {
    const result = resolveHapticType(true, "success")
    expect(result).toBe("success")
  })

  test("should return default type when value is undefined", () => {
    const result = resolveHapticType(undefined, "error")
    expect(result).toBe("error")
  })

  test("should return the value when it is a HapticType", () => {
    const result = resolveHapticType("error" as HapticType, "success")
    expect(result).toBe("error")
  })

  test("should handle all haptic types", () => {
    const hapticTypes: HapticType[] = ["success", "error"]
    
    for (const hapticType of hapticTypes) {
      const result = resolveHapticType(hapticType, "success")
      expect(result).toBe(hapticType)
    }
  })
})
