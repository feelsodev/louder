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

function escapeForPowerShell(str: string): string {
  return str.replace(/'/g, "''")
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

async function sendLinuxNotification(options: NotificationOptions): Promise<void> {
  const { title, message, subtitle } = options
  const fullMessage = subtitle ? `${subtitle}\n${message}` : message
  await execFileAsync('notify-send', [title, fullMessage])
}

async function sendWindowsNotification(options: NotificationOptions): Promise<void> {
  const { title, message, subtitle } = options
  const psTitle = escapeForPowerShell(title)
  const fullMessage = subtitle ? `${subtitle}\n${message}` : message
  const psMessage = escapeForPowerShell(fullMessage)
  const toastScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$Template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$RawXml = [xml] $Template.GetXml()
($RawXml.toast.visual.binding.text | Where-Object {$_.id -eq '1'}).AppendChild($RawXml.CreateTextNode('${psTitle}')) | Out-Null
($RawXml.toast.visual.binding.text | Where-Object {$_.id -eq '2'}).AppendChild($RawXml.CreateTextNode('${psMessage}')) | Out-Null
$SerializedXml = New-Object Windows.Data.Xml.Dom.XmlDocument
$SerializedXml.LoadXml($RawXml.OuterXml)
$Toast = [Windows.UI.Notifications.ToastNotification]::new($SerializedXml)
$Notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Echo')
$Notifier.Show($Toast)
`.trim().replace(/\n/g, "; ")
   await execFileAsync('powershell', ['-NoProfile', '-Command', toastScript])
}

export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  const { platform: providedPlatform } = options
  const currentPlatform = providedPlatform ?? detectPlatform()

  try {
    switch (currentPlatform) {
      case "darwin":
        await sendDarwinNotification(options)
        return true
      case "linux":
        await sendLinuxNotification(options)
        return true
      case "win32":
        await sendWindowsNotification(options)
        return true
      default:
        return false
    }
  } catch {
    return false
  }
}
