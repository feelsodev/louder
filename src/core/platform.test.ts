import { describe, test, expect } from "vitest"
import { detectPlatform } from "./platform"

describe("detectPlatform", () => {
  test("should return a valid platform string", () => {
    const platform = detectPlatform()
    expect(["darwin", "linux", "win32", "unsupported"]).toContain(platform)
  })
})
