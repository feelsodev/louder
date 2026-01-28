import { cosmiconfig } from "cosmiconfig"
import { z } from "zod"

export type EchoEvent = "stop" | "notification" | "idle" | "error" | "progress"

export const SoundTypeSchema = z.enum([
  "success",
  "info",
  "warning",
  "error",
  "progress",
  "reminder",
  "default",
  "silent",
])

export const EventConfigSchema = z.union([
  z.boolean(),
  SoundTypeSchema,
])

export const EchoConfigSchema = z.object({
  title: z.string().optional(),
  message: z.string().optional(),
  subtitle: z.string().optional(),
  open: z.string().optional(),
  sound: z.union([z.boolean(), SoundTypeSchema]).optional(),
  soundPath: z.string().optional(),
  delay: z.number().min(0).optional(),
  events: z.object({
    stop: EventConfigSchema.optional(),
    notification: EventConfigSchema.optional(),
    idle: EventConfigSchema.optional(),
    error: EventConfigSchema.optional(),
    progress: EventConfigSchema.optional(),
  }).optional(),
})

export type EchoConfig = z.infer<typeof EchoConfigSchema>
export type SoundTypeValue = z.infer<typeof SoundTypeSchema>
export type EventConfig = z.infer<typeof EventConfigSchema>

const explorer = cosmiconfig("louder", {
  searchPlaces: [
    "package.json",
    ".louderrc",
    ".louderrc.json",
    ".louderrc.yaml",
    ".louderrc.yml",
    ".louderrc.js",
    ".louderrc.cjs",
    "louder.config.js",
    "louder.config.cjs",
  ],
})

export async function loadConfig(searchFrom?: string): Promise<EchoConfig> {
  try {
    const result = searchFrom
      ? await explorer.search(searchFrom)
      : await explorer.search()

    if (!result || result.isEmpty) {
      return {}
    }

    const parsed = EchoConfigSchema.safeParse(result.config)
    if (!parsed.success) {
      console.error("[louder] Invalid config:", parsed.error.message)
      return {}
    }

    return parsed.data
  } catch {
    return {}
  }
}
