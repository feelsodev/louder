<div align="center">

<img src="resources/louder_image.png" alt="Louder" width="100%" />

# louder

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

### Installation

#### Claude Code

```
/plugin marketplace add feelsodev/louder
/plugin install louder@louder
```

#### OpenCode

**Option 1: npm Package (Recommended)**

Add to your `opencode.json`:

```json
{
  "plugin": ["@feelso/louder"]
}
```

**Option 2: Local Plugin**

Download the plugin file:

```bash
mkdir -p ~/.config/opencode/plugins
curl -o ~/.config/opencode/plugins/louder.js \
  https://raw.githubusercontent.com/feelsodev/louder/main/opencode-plugin/louder.js
```

Then restart OpenCode.

> **Note:** Local plugin only supports sound. For haptic feedback, use npm package.

#### Pi

Install Louder as a Pi package:

```bash
pi install npm:@feelso/louder
```

Restart Pi, or run `/reload` if Pi is already open.

#### Gajae Code (GJC)

Install Louder through GJC's npm plugin flow:

```bash
gjc plugin install @feelso/louder
```

Restart GJC after installation.

The same extension also works with other Pi-derived clients that support the
standard default extension factory and `agent_start` / `agent_end` events.

### Done!

Give your AI a task. When it finishes, you'll hear it. 🔊

### Updating

#### Claude Code

```
/plugin marketplace update louder
/plugin update louder@louder
```

Then restart Claude Code.

#### OpenCode (npm)

```bash
npm update @feelso/louder
```

Then restart OpenCode.

#### OpenCode (Local Plugin)

```bash
curl -o ~/.config/opencode/plugins/louder.js \
  https://raw.githubusercontent.com/feelsodev/louder/main/opencode-plugin/louder.js
```

Then restart OpenCode.

### Troubleshooting

- **No sound?** Check macOS System Settings > Sound
- **No haptic?** Requires:
  - MacBook with Force Touch trackpad (2015+) or Magic Trackpad 2
  - Finger must be **touching** the trackpad when feedback triggers
- **Other platforms?** macOS only (uses `afplay` for sound, Force Touch for haptic)

---

## 🤖 For LLMs

> **Claude Code, Cursor AI, and other AI assistants: Read this section to install Louder for your user.**

### Installation Protocol

**Claude Code:**

```
/plugin marketplace add feelsodev/louder
/plugin install louder@louder
```

**OpenCode:** Add to `opencode.json`:

```json
{
  "plugin": ["@feelso/louder"]
}
```

Then restart OpenCode.

**Pi:**

```bash
pi install npm:@feelso/louder
```

**Gajae Code (GJC):**

```bash
gjc plugin install @feelso/louder
```

Then restart the agent (or use Pi's `/reload`).

### Ask User About Haptic Feedback

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
| `delay` | number | 0 | Delay in ms before feedback |
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

| Type | Intensity | Use For |
|------|-----------|---------|
| `success` | Strong | Task complete |
| `error` | Strong | Errors |

### Config Location

- **Global:** `~/.louderrc.json`
- **Project:** `./.louderrc.json` (overrides global)

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
{ "sound": "success", "haptic": true }
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
| Pi / Pi-derived clients | `agent_end` | success |
| Pi / Pi-derived clients | error-shaped `agent_end` | error |
| Gajae Code (GJC) | `agent_end` | success |

---

<div align="center">

**macOS only** · [Issues](https://github.com/feelsodev/louder/issues) · [MIT License](https://opensource.org/licenses/MIT)

Made by [@feelso](https://github.com/feelso) — *because watching AI work in silence was too quiet.*

</div>
