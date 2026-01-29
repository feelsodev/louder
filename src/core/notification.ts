import { type Platform } from "./platform"

export interface NotificationOptions {
  title: string
  message: string
  subtitle?: string
  open?: string
  appIcon?: string
  contentImage?: string
  platform?: Platform
}

export async function sendNotification(_options: NotificationOptions): Promise<boolean> {
  return true
}
