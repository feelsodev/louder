import { platform } from "node:os"

export type Platform = "darwin" | "linux" | "win32" | "unsupported"

export function detectPlatform(): Platform {
  const p = platform()
  if (p === "darwin" || p === "linux" || p === "win32") {
    return p
  }
  return "unsupported"
}
