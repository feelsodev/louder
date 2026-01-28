import { platform } from "node:os"

export type Platform = "darwin" | "unsupported"

export function detectPlatform(): Platform {
  const p = platform()
  if (p === "darwin") {
    return p
  }
  return "unsupported"
}
