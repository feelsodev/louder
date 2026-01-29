<div align="center">

# 🔔 @feelso/louder

[![npm version](https://img.shields.io/npm/v/@feelso/louder.svg)](https://www.npmjs.com/package/@feelso/louder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![macOS only](https://img.shields.io/badge/platform-macOS-lightgrey.svg)](https://www.apple.com/macos/)

**Smart notification system for AI coding assistants**

Get notified with sound and haptic feedback when Claude Code or OpenCode finishes a task.

[Installation](#-installation-guide-for-humans) · [Quick Start](#-quick-start) · [API Docs](#-programmatic-api)

</div>

---

## 🤔 Why Louder?

Ever had this experience with AI coding tools?

```
You tell Claude Code "fix this bug" and then...
→ Watch YouTube
→ Grab coffee
→ Check Slack
→ 30 minutes later: "Oh? It finished already?" 😅
```

**Louder solves this problem.**

- ✅ **Instant notification** when tasks complete (macOS system notifications)
- 🔊 **Different sounds** for different situations (success, error, warning, etc.)
- 📳 **Haptic feedback** on your MacBook trackpad (success/error)
- 🖱️ **Clickable notifications** to open results (URLs, files)
- ⚙️ **Fully customizable**

Now you can do other things while AI works. It'll let you know when it's done.

---

## ✨ Key Features

- 🎵 **Context-aware sounds** - 8 different sounds for success, error, warning, progress, etc.
- 📳 **Haptic feedback** - Feel task completion on your MacBook trackpad
- 📬 **Multiple notification types** - Predefined types like Task Complete, Error, Progress
- 🖱️ **Clickable notifications** - Click to open URLs, files, logs, etc.
- 🍎 **macOS native** - Perfect integration with system notifications and sounds
- ⚙️ **Fine-grained control** - Configure sound, haptic, message, delay separately per event

---

## 📦 Installation

### 💁 Installation Guide for Humans

**Step 1: Install the package**

Open your terminal and run:

```bash
npm install -g @feelso/louder
```

> 💡 The `-g` flag installs globally so you can use it anywhere.

**Step 2: Configure your AI tool**

Modify the configuration file for your AI coding tool.

#### Claude Code Users

Open the settings file in your terminal:

```bash
# Create the file if it doesn't exist
mkdir -p ~/.claude
touch ~/.claude/settings.json

# Open with editor (VS Code example)
code ~/.claude/settings.json

# Or open with nano
nano ~/.claude/settings.json
```

**Copy and paste** the following content:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx @feelso/louder",
            "timeout": 5000
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "npx @feelso/louder",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

> ⚠️ **Warning**: If your `settings.json` already has other settings, only add the `"hooks"` section to the existing content.

#### OpenCode Users

Create an `opencode.json` file in your project root:

```bash
# Navigate to your project folder first
touch opencode.json
```

Add the following content:

```json
{
  "plugin": ["@feelso/louder"]
}
```

**Step 3: Test it**

Give Claude Code or OpenCode a simple task. If you hear a sound and see a notification when it finishes, you're all set! 🎉

#### Troubleshooting

<details>
<summary>❌ No notifications appearing?</summary>

1. Check macOS System Settings > Notifications to ensure Terminal/iTerm notifications are allowed
2. Verify the `~/.claude/settings.json` file path is correct
3. Check for JSON syntax errors (commas, braces, etc.)
4. Restart Claude Code and try again

</details>

<details>
<summary>🔇 No sound playing?</summary>

1. Check that macOS system sounds are enabled
2. Verify `.louderrc.json` doesn't have `"sound": false`
3. Check volume settings

</details>

<details>
<summary>💻 Does it work on other platforms (Windows, Linux)?</summary>

Unfortunately, it's currently **macOS only**. We use macOS native notification system (`osascript`) and sound playback (`afplay`).

</details>

---

### 🤖 Installation Guide for AI Assistants

> **Claude Code, Cursor AI, and other AI assistants can read this section and install it themselves.**

**Installation Protocol**:

1. **Install package**: Global or project-local installation

```bash
npm install -g @feelso/louder
# Or project-local
npm install --save-dev @feelso/louder
```

2. **Configure Claude Code hooks**: Add hooks to `~/.claude/settings.json`

**Important**: If the file already exists, merge only the `hooks` section while preserving existing content.

Complete example (`~/.claude/settings.json`):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx @feelso/louder",
            "timeout": 5000
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "npx @feelso/louder",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

3. **Configure OpenCode plugin**: Add to `opencode.json` in project root

```json
{
  "plugin": ["@feelso/louder"]
}
```

**File locations**:
- **Claude Code settings**: `~/.claude/settings.json` (`.claude` folder in user home directory)
- **OpenCode settings**: `opencode.json` in project root
- **Louder config (optional)**: `.louderrc.json` in project root or `~/.louderrc.json`

**Verification steps**:

```bash
# 1. Check settings file exists
ls -la ~/.claude/settings.json

# 2. Validate JSON syntax
cat ~/.claude/settings.json | jq .

# 3. Check npx is available
which npx

# 4. Verify package installation
npm list -g @feelso/louder
```

After installation, tell the user: "Installation complete. You'll receive notifications when the next task finishes."

---

## 🚀 Quick Start

Just install and you're ready to go! The default settings work great, but check the configuration section below if you want to customize.

**Default behavior**:
- ✅ Claude Code task complete → 🔊 success sound + notification
- ⚠️ Error occurs → 🔊 error sound + notification
- 📢 User input needed → 🔊 info sound + notification

**Try it now**:

```bash
# In Claude Code
"Read this README file"

# When it finishes... Ding! 🔔 You get a notification
```

---

## ⚙️ Configuration (Optional)

If you don't like the defaults, you can customize with a `.louderrc.json` file.

**Create configuration file**:

Create `.louderrc.json` in your project root or home directory (`~`):

```bash
# Project-specific config
touch .louderrc.json

# Or global config (applies to all projects)
touch ~/.louderrc.json
```

**Complete configuration example** (copy and modify):

```json
{
  "title": "Louder",
  "message": "Task completed",
  "subtitle": "Click to view",
  "open": "https://github.com",
  "sound": "success",
  "delay": 1500,
  "events": {
    "stop": "success",
    "notification": "info",
    "idle": "reminder",
    "error": "error",
    "progress": "progress"
  }
}
```

### 📋 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | "Louder" | Notification title |
| `message` | string | "Task completed" | Notification message |
| `subtitle` | string | - | Notification subtitle |
| `open` | string | - | URL to open on click (macOS only) |
| `sound` | boolean \| SoundType | true | Enable sound or specify sound type |
| `soundPath` | string | System default | Custom sound file path |
| `haptic` | boolean \| HapticType | false | Enable haptic feedback (`"success"` or `"error"`) |
| `delay` | number | 1500 | Delay before notification (ms) |
| `events` | object | - | Event-specific settings |

### 📁 Supported Configuration Formats

Don't like JSON? You can use YAML or JavaScript too:

```
✅ .louderrc
✅ .louderrc.json
✅ .louderrc.yaml / .louderrc.yml
✅ .louderrc.js / .louderrc.cjs
✅ louder.config.js / louder.config.cjs
✅ "louder" key in package.json
```

Automatically discovered thanks to [cosmiconfig](https://github.com/davidtheclark/cosmiconfig).

---

## 🔊 Sound Types

8 sound types for different situations:

| Type | Use Case | macOS Sound |
|------|----------|-------------|
| `success` | Task completed | Glass |
| `info` | Information | Blow |
| `warning` | Warning | Sosumi |
| `error` | Error | Basso |
| `progress` | Progress update | Tink |
| `reminder` | Reminder | Ping |
| `default` | Default | Glass |
| `silent` | No sound | - |

### 🎯 Event-Specific Sounds

Assign different sounds to each event:

```json
{
  "events": {
    "stop": "success",        // Task complete → success sound
    "error": "error",          // Error → error sound
    "idle": "reminder",        // Idle → reminder sound
    "progress": "progress",    // In progress → progress sound
    "notification": false      // Disable notification
  }
}
```

**Value options**:
- `true` → Use default sound
- `false` → Completely disable event (no sound, no notification)
- `"success"`, `"error"`, etc. → Specify sound type

---

## 📳 Haptic Feedback

Feel task completion through your MacBook's Force Touch trackpad!

| Type | Use Case | Feedback Pattern |
|------|----------|------------------|
| `success` | Task completed | Strong tap (levelChange) |
| `error` | Error occurred | Subtle tap (generic) |

### Enabling Haptic Feedback

Haptic feedback is **disabled by default**. Enable it in your config:

```json
{
  "haptic": true
}
```

Or specify the type:

```json
{
  "haptic": "success"
}
```

### Haptic + Sound Combo

```json
{
  "sound": "success",
  "haptic": "success"
}
```

> 💡 **Note**: Haptic feedback requires a MacBook with Force Touch trackpad and your finger on the trackpad.

---

## 💡 Usage Examples

### 📌 Scenario 1: Default Settings (Just Use It)

No configuration needed:

```json
{
  "sound": true,
  "delay": 1500
}
```

Get notification + default sound 1.5 seconds after task completes.

### 📌 Scenario 2: Different Sounds per Event

Only differentiate success and error:

```json
{
  "events": {
    "stop": "success",     // Task complete → cheerful sound
    "error": "error"       // Error → heavy sound
  }
}
```

### 📌 Scenario 3: Only Notify on Errors

Focus mode - only get interrupted for errors:

```json
{
  "events": {
    "stop": false,         // Silent on normal completion
    "idle": false,         // Ignore idle
    "error": "error"       // Only notify on errors!
  }
}
```

### 📌 Scenario 4: Silent Notifications (Quiet Office)

Get notifications but no sound:

```json
{
  "sound": "silent"
}
```

Visual notifications only.

### 📌 Scenario 5: Click to Open Log File

Check log immediately after build completes:

```json
{
  "title": "Build Complete",
  "message": "Click to view log",
  "open": "file:///var/log/build.log"
}
```

Click notification → log file opens automatically!

### 📌 Scenario 6: Jump Straight to GitHub PR

Go to PR after CI completes:

```json
{
  "title": "CI Passed!",
  "message": "Check your PR",
  "open": "https://github.com/yourname/repo/pull/123"
}
```

---

## 📚 Programmatic API

Detailed API documentation for developers. Reference this section if you want to use Louder directly in your code.

### 🏗️ Create Notifier

```typescript
import { createNotifier } from '@feelso/louder'

const notifier = createNotifier({
  title: "My App",
  sound: "success",
})

// Trigger notification
await notifier.trigger()

// Cancel notification
notifier.cancel()
```

### 🎁 Convenience Methods (Common Notifications)

```typescript
const notifier = createNotifier()

// Task complete notification
await notifier.sendTaskComplete("Build", "Completed in 3.2s")

// Error notification
await notifier.sendError("Build failed", "TypeScript errors found")

// Progress notification
await notifier.sendProgress("Installing", "2/5 packages")

// Custom notification
await notifier.sendCustom({
  title: "Custom",
  message: "Hello",
  sound: "info",
  subtitle: "Subtitle",
})
```

### ⚡ Standalone Functions (Quick One-Off)

```typescript
import {
  sendTaskCompleteNotification,
  sendErrorNotification,
  sendProgressNotification,
} from '@feelso/louder'

await sendTaskCompleteNotification("Deployment", "Successfully deployed")
await sendErrorNotification("API Error", "Connection timeout")
await sendProgressNotification("Processing", "50% complete")
```

### 🔧 Low-Level API (Fine Control)

```typescript
import {
  sendNotification,
  playSound,
  playHaptic,
} from '@feelso/louder'

// Send notification only
await sendNotification({
  title: "Title",
  message: "Message",
  subtitle: "Subtitle",
  open: "https://example.com",
})

// Play sound only
await playSound({ soundType: "success" })

// Trigger haptic only
await playHaptic({ hapticType: "success" })
```

### 📂 Load Configuration

```typescript
import { loadConfig } from '@feelso/louder'

const config = await loadConfig()
// Or search in specific directory
const config = await loadConfig("/path/to/project")
```

---

---

## 🖥️ Platform Support

| Platform | Notifications | Sound | Haptic | Open URLs | Support Status |
|----------|---------------|-------|--------|-----------|----------------|
| **macOS** | osascript | afplay | Force Touch | ✅ | ✅ Full support |
| **Windows** | - | - | - | ❌ | ❌ Not supported |
| **Linux** | - | - | - | ❌ | ❌ Not supported |

> 💡 **macOS only**. We use macOS native notification system, sound, and haptic feedback.

---

## 📡 Event Details

### Claude Code Events

| Event | Description | Default Sound |
|-------|-------------|---------------|
| `Stop` | Agent task completed | success |
| `Notification` | User input required | info |

### OpenCode Events

| Event | Description | Default Sound |
|-------|-------------|---------------|
| `session.idle` | Session idle | reminder |
| `session.error` | Session error | error |
| `session.progress` | Progress update | progress |

---

## 🎯 TypeScript Support

If you're using TypeScript, you can import all types:

```typescript
import type {
  NotifierConfig,      // Notifier creation options
  Notifier,            // Notifier instance type
  NotificationOptions, // Notification options
  SoundType,           // Sound type ('success' | 'error' | ...)
  SoundOptions,        // Sound options
  HapticType,          // Haptic type ('success' | 'error')
  HapticOptions,       // Haptic options
  EchoEvent,           // Event type
  EchoConfig,          // Configuration file type
} from '@feelso/louder'
```

Free autocomplete and type checking! 🎉

---

## 🤝 Contributing

Found a bug or have a feature suggestion?

1. [Report an issue](https://github.com/feelsodev/louder/issues)
2. Pull requests welcome!

---

## 📄 License

MIT License - use it freely!

---

<div align="center">

**Made by**: [@feelso](https://github.com/feelso)

Built this because I wanted to do other things while AI codes 😄

⭐ If this helped you, please give it a star!

</div>
