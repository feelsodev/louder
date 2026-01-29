import { describe, test, expect } from "vitest"

describe("notification", () => {
  test("should return true without sending notification", async () => {
    const { sendNotification } = await import("./notification")

    const result = await sendNotification({
      title: "Test",
      message: "Message",
      platform: "darwin",
    })

    expect(result).toBe(true)
  })
})
