import { describe, test, expect, vi, beforeEach } from "vitest"
import { execFile } from "node:child_process"

vi.mock("node:child_process", () => ({
  execFile: vi.fn((cmd, args, callback) => {
    if (callback) callback(null, "", "")
    return { on: vi.fn() }
  }),
}))

vi.mock("node:util", () => ({
  promisify: vi.fn((fn) => {
    return (...args: unknown[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (err: Error | null, stdout: string, stderr: string) => {
          if (err) reject(err)
          else resolve({ stdout, stderr })
        })
      })
    }
  }),
}))

describe("notification security", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("should use execFile instead of exec for shell injection prevention", async () => {
    const { sendNotification } = await import("./notification")
    
    await sendNotification({
      title: "Test",
      message: "Message",
      platform: "darwin",
    })

    expect(execFile).toHaveBeenCalled()
    const calls = vi.mocked(execFile).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    
    const [cmd, args] = calls[0]
    expect(cmd).toBe("osascript")
    expect(Array.isArray(args)).toBe(true)
  })

  test("should pass arguments as array, not string interpolation", async () => {
    const { sendNotification } = await import("./notification")
    
    const maliciousInput = "'; rm -rf /; '"
    
    await sendNotification({
      title: maliciousInput,
      message: "Test",
      platform: "darwin",
    })

    const calls = vi.mocked(execFile).mock.calls
    const [, args] = calls[0]
    
    expect(Array.isArray(args)).toBe(true)
    expect(args).toContain("-e")
  })
})
