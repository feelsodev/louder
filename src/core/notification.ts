import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { detectPlatform, type Platform } from "./platform"

const execFileAsync = promisify(execFile)

export interface NotificationOptions {
  title: string
  message: string
  subtitle?: string
  open?: string
  platform?: Platform
}

function escapeForAppleScript(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

async function sendDarwinNotification(options: NotificationOptions): Promise<void> {
  const { title, message, subtitle, open } = options
  const esTitle = escapeForAppleScript(title)
  const esMessage = escapeForAppleScript(message)

  let script = `display notification "${esMessage}" with title "${esTitle}"`

  if (subtitle) {
    const esSubtitle = escapeForAppleScript(subtitle)
    script = `display notification "${esMessage}" with title "${esTitle}" subtitle "${esSubtitle}"`
  }

   await execFileAsync('osascript', ['-e', script])

   if (open) {
     await execFileAsync('open', [open]).catch(() => {})
  }
}

export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  const { platform: providedPlatform } = options
  const currentPlatform = providedPlatform ?? detectPlatform()

  try {
    if (currentPlatform === "darwin") {
      await sendDarwinNotification(options)
      return true
    }
    return false
  } catch {
    return false
  }
}
