<div align="center">

# 🔔 @feelso/louder

[![npm version](https://img.shields.io/npm/v/@feelso/louder.svg)](https://www.npmjs.com/package/@feelso/louder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![macOS only](https://img.shields.io/badge/platform-macOS-orange.svg)](https://www.apple.com/macos/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

**Your AI learned to shout.**

[For Humans](#-for-humans) · [For LLMs](#-for-llms) · [Configuration](#%EF%B8%8F-configuration)

</div>

---

## 🤔 Why "Louder"?

> *Your AI assistant works hard in silence.*
> *But when it's done? It deserves to be LOUDER.*

```
You: "Hey Claude, fix this bug"
Claude: *works silently for 10 minutes*
You: *watching YouTube, completely forgot*
Claude: *whispers* "...done"
You: *30 minutes later* "Oh, it finished ages ago!" 😅
```

**With Louder:**

```
You: "Hey Claude, fix this bug"
Claude: *works silently for 10 minutes*
Claude: 🔊 *DING!* 📳 *bzzt*
You: "Nice, let's keep going!"
```

**Your AI finally speaks up.** Sound + haptic feedback when tasks complete.

---

## 👤 For Humans

### Step 1: Install

```bash
npm install -g @feelso/louder
```

### Step 2: Configure Your AI Tool

#### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "npx @feelso/louder", "timeout": 5000 }] }],
    "Notification": [{ "matcher": ".*", "hooks": [{ "type": "command", "command": "npx @feelso/louder", "timeout": 5000 }] }]
  }
}
```

> Merge into existing settings if you have other configurations.

#### OpenCode

Add to `opencode.json` in project root:

```json
{
  "plugin": ["@feelso/louder"]
}
```

### Step 3: Done!

Give your AI a task. When it finishes, you'll hear it. 🔊

### Troubleshooting

- **No sound?** Check macOS System Settings > Sound
- **No haptic?** Requires MacBook with Force Touch trackpad + finger on trackpad
- **Other platforms?** macOS only (uses `afplay` for sound)

---

## 🤖 For LLMs

> **Claude Code, Cursor AI, and other AI assistants: Read this section to install Louder for your user.**

### Installation Protocol

**1. Install package globally:**

```bash
npm install -g @feelso/louder
```

**2. Configure Claude Code hooks:**

File: `~/.claude/settings.json`

If file exists, merge `hooks` section. If not, create with this content:

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "npx @feelso/louder", "timeout": 5000 }] }],
    "Notification": [{ "matcher": ".*", "hooks": [{ "type": "command", "command": "npx @feelso/louder", "timeout": 5000 }] }]
  }
}
```

**3. Configure OpenCode (if applicable):**

File: `opencode.json` in project root

```json
{
  "plugin": ["@feelso/louder"]
}
```

### Verification

```bash
npm list -g @feelso/louder  # Verify installation
```

### 4. Ask User About Haptic Feedback

**Ask the user:** *"Would you like haptic feedback (trackpad vibration) when tasks complete? Requires MacBook with Force Touch trackpad."*

If user wants haptic, create `~/.louderrc.json`:

```json
{
  "haptic": true
}
```

### Post-Installation Message

Tell your user: *"Louder installed. You'll hear a sound (and feel a vibration if enabled) when tasks complete."*

### Changing Settings

When user asks to change Louder settings, edit `~/.louderrc.json`:

| User Request | Config |
|--------------|--------|
| "Turn off sound" | `{ "sound": false }` |
| "Turn on haptic" | `{ "haptic": true }` |
| "Turn off haptic" | `{ "haptic": false }` |
| "Only notify on errors" | `{ "events": { "stop": false, "error": "error" } }` |
| "Change sound to Ping" | `{ "sound": "reminder" }` |
| "Disable all notifications" | `{ "sound": false, "haptic": false }` |

**Available sound types:** `success`, `error`, `info`, `warning`, `progress`, `reminder`, `silent`

**Show current settings:**
```bash
cat ~/.louderrc.json 2>/dev/null || echo "Using defaults (sound: on, haptic: off)"
```

---

## 🚀 Quick Start

**Zero config needed.** Default behavior:

| Event | What Happens |
|-------|--------------|
| Task complete | 🔊 *Glass* sound |
| Error | 🔊 *Basso* sound |
| Needs input | 🔊 *Blow* sound |

Want haptic feedback? Add to `.louderrc.json`:

```json
{ "haptic": true }
```

---

## ⚙️ Configuration

Create `.louderrc.json` in project root or `~/.louderrc.json` for global config.

```json
{
  "sound": "success",
  "haptic": true,
  "delay": 1500,
  "events": {
    "stop": "success",
    "error": "error"
  }
}
```

### All Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sound` | boolean \| string | true | Sound type or `false` to disable |
| `soundPath` | string | - | Custom sound file path (.aiff) |
| `haptic` | boolean \| string | false | `true`, `"success"`, or `"error"` |
| `delay` | number | 1500 | Delay in ms before feedback |
| `events` | object | - | Per-event overrides |

### Sound Types

| Type | Sound | Use For |
|------|-------|---------|
| `success` | Glass | Task complete |
| `error` | Basso | Errors |
| `info` | Blow | Information |
| `warning` | Sosumi | Warnings |
| `progress` | Tink | Progress |
| `reminder` | Ping | Reminders |
| `default` | Glass | Default (same as success) |
| `silent` | - | No sound |

### Haptic Types

| Type | Pattern | Use For |
|------|---------|---------|
| `success` | Strong tap (levelChange) | Task complete |
| `error` | Subtle tap (generic) | Errors |

### Config Formats

Also supports: `.louderrc.yaml`, `.louderrc.js`, `louder.config.js`, `package.json` (`"louder"` key)

---

## 💡 Recipes

**Focus Mode** - Only errors make sound:
```json
{ "events": { "stop": false, "idle": false, "error": "error" } }
```

**Silent Mode** - No sound at all:
```json
{ "sound": "silent" }
```

**Full Feedback** - Sound + Haptic:
```json
{ "sound": "success", "haptic": "success" }
```

**Custom Sound** - Use your own sound file:
```json
{ "soundPath": "/path/to/custom.aiff" }
```

---

## 📡 Events Reference

| Tool | Event | Default Sound |
|------|-------|---------------|
| Claude Code | `Stop` | success |
| Claude Code | `Notification` | info |
| OpenCode | `session.idle` | reminder |
| OpenCode | `session.error` | error |
| OpenCode | `session.progress` | progress |

---

<div align="center">

**macOS only** · [Issues](https://github.com/feelsodev/louder/issues) · [MIT License](https://opensource.org/licenses/MIT)

Made by [@feelso](https://github.com/feelso) — *because watching AI work in silence was too quiet.*

</div>
