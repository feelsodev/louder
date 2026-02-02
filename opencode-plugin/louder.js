/**
 * Louder - OpenCode Plugin
 * Sound + Haptic feedback when AI tasks complete
 * 
 * Haptic requires: macOS + Force Touch trackpad + native binary
 * Build native binary: cd native && ./build.sh
 */
import { spawn } from "child_process"
import { existsSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { homedir } from "os"

const SOUND_MAP = {
  success: "/System/Library/Sounds/Glass.aiff",
  error: "/System/Library/Sounds/Basso.aiff",
  info: "/System/Library/Sounds/Blow.aiff",
  warning: "/System/Library/Sounds/Sosumi.aiff",
  progress: "/System/Library/Sounds/Tink.aiff",
  reminder: "/System/Library/Sounds/Ping.aiff",
}

function findHapticBinary() {
  // Prefer packaged binary first (security: avoid hijack from user-writable paths)
  const locations = [
    join(dirname(fileURLToPath(import.meta.url)), "..", "native", "HapticEngine"),
    join(dirname(fileURLToPath(import.meta.url)), "native", "HapticEngine"),
    join(homedir(), ".config/opencode/native/HapticEngine"),
    join(homedir(), ".local/share/louder/HapticEngine"),
  ]
  
  for (const loc of locations) {
    if (existsSync(loc)) return loc
  }
  return null
}

let hapticEngine = null
let hapticBinaryPath = null
let enginePromise = null

function getHapticEngine() {
  if (hapticEngine) return Promise.resolve(hapticEngine)
  if (enginePromise) return enginePromise
  
  enginePromise = new Promise((resolve) => {
    if (!hapticBinaryPath) {
      hapticBinaryPath = findHapticBinary()
    }
    
    if (!hapticBinaryPath) {
      resolve(null)
      return
    }
    
    const proc = spawn(hapticBinaryPath, [], {
      stdio: ["pipe", "ignore", "ignore"],
    })
    
    proc.once("spawn", () => {
      hapticEngine = {
        write: (cmd) => {
          try {
            proc.stdin.write(cmd + "\n")
            return true
          } catch {
            return false
          }
        }
      }
      resolve(hapticEngine)
    })
    
    proc.once("error", () => {
      hapticEngine = null
      enginePromise = null
      resolve(null)
    })
    proc.once("exit", () => {
      hapticEngine = null
      enginePromise = null
    })
  })
  
  return enginePromise
}

async function playSound(type = "success") {
  const soundPath = SOUND_MAP[type] || SOUND_MAP.success
  if (existsSync(soundPath)) {
    spawn("afplay", [soundPath], { stdio: "ignore" })
  }
}

async function playHaptic(intensity = 2.0) {
  const engine = await getHapticEngine()
  if (engine) {
    engine.write(`15,${intensity}`)
  }
}

async function notify(soundType = "success", hapticIntensity = 2.0) {
  await Promise.all([
    playSound(soundType),
    playHaptic(hapticIntensity)
  ])
}

const notifiedSessions = new Set()
const MAX_SESSIONS = 100

function trackSession(sessionID) {
  notifiedSessions.add(sessionID)
  if (notifiedSessions.size > MAX_SESSIONS) {
    const oldest = notifiedSessions.values().next().value
    if (oldest) notifiedSessions.delete(oldest)
  }
}

export const louderPlugin = async (ctx) => {
  return {
    event: async ({ event }) => {
      const props = event.properties
      const sessionID = props?.info?.id || props?.sessionID
      
      if (event.type === "session.updated" || event.type === "message.updated") {
        if (sessionID) notifiedSessions.delete(sessionID)
        return
      }
      
      if (event.type === "session.idle") {
        if (!sessionID || notifiedSessions.has(sessionID)) return
        trackSession(sessionID)
        await notify("success", 2.0)
      }
      
      if (event.type === "session.error") {
        if (!sessionID || notifiedSessions.has(sessionID)) return
        trackSession(sessionID)
        await notify("error", 2.0)
      }
    }
  }
}
