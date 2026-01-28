# @feelso/echo

<p align="center">
  <strong>AI 코딩 어시스턴트를 위한 OS 알림 플러그인</strong>
</p>

<p align="center">
  Claude Code나 OpenCode가 작업을 완료하면 알림을 받으세요.
</p>

---

## Features

- **Contextual Sounds** - 이벤트 타입별 다른 사운드 (success, error, warning, info, progress, reminder)
- **Multiple Notification Types** - Task Complete, Error, Progress 등 사전 정의된 알림 타입
- **Interactive Notifications** - 클릭 시 URL 열기 (macOS)
- **Cross-Platform** - macOS, Linux, Windows 지원
- **Highly Configurable** - 이벤트별 사운드, 커스텀 메시지, 딜레이 등 세부 설정

---

## Installation

```bash
npm install @feelso/echo
```

---

## Quick Start

### Claude Code

`~/.claude/settings.json`에 추가:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npx @feelso/echo-claude-hook",
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
            "command": "npx @feelso/echo-claude-hook",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

### OpenCode

`opencode.json`에 추가:

```json
{
  "plugin": ["@feelso/echo"]
}
```

---

## Configuration

프로젝트 루트 또는 홈 디렉토리에 `.echorc.json` 생성:

```json
{
  "title": "Echo",
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

### 설정 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `title` | string | "Echo" | 알림 제목 |
| `message` | string | "Task completed" | 알림 메시지 |
| `subtitle` | string | - | 알림 부제목 |
| `open` | string | - | 클릭 시 열 URL (macOS 전용) |
| `sound` | boolean \| SoundType | true | 사운드 재생 여부 또는 사운드 타입 |
| `soundPath` | string | 시스템 기본값 | 커스텀 사운드 파일 경로 |
| `delay` | number | 1500 | 알림 전 딜레이 (ms) |
| `events` | object | - | 이벤트별 설정 |

### 지원 설정 파일 형식

[cosmiconfig](https://github.com/davidtheclark/cosmiconfig)을 통해 다양한 형식 지원:

- `.echorc`
- `.echorc.json`
- `.echorc.yaml` / `.echorc.yml`
- `.echorc.js` / `.echorc.cjs`
- `echo.config.js` / `echo.config.cjs`
- `package.json`의 `"echo"` 키

---

## Sound Types

이벤트 타입에 맞는 8가지 사운드:

| 타입 | 용도 | macOS | Linux | Windows |
|------|------|-------|-------|---------|
| `success` | 작업 완료 | Glass | complete.oga | tada.wav |
| `info` | 정보 알림 | Blow | dialog-information.oga | Background.wav |
| `warning` | 경고 | Sosumi | dialog-warning.oga | Exclamation.wav |
| `error` | 오류 | Basso | dialog-error.oga | Critical Stop.wav |
| `progress` | 진행 상황 | Tink | message.oga | Notify.wav |
| `reminder` | 리마인더 | Ping | bell.oga | notify.wav |
| `default` | 기본 | Glass | complete.oga | notify.wav |
| `silent` | 무음 | - | - | - |

### 이벤트별 사운드 설정

각 이벤트에 다른 사운드를 지정할 수 있습니다:

```json
{
  "events": {
    "stop": "success",
    "error": "error",
    "idle": "reminder",
    "progress": "progress",
    "notification": false
  }
}
```

- `true`: 기본 사운드 사용
- `false`: 해당 이벤트 비활성화
- `SoundType`: 특정 사운드 사용

---

## Programmatic API

### Notifier 생성

```typescript
import { createNotifier } from '@feelso/echo'

const notifier = createNotifier({
  title: "My App",
  sound: "success",
})

// 알림 트리거
await notifier.trigger()

// 알림 취소
notifier.cancel()
```

### 편의 메서드

```typescript
const notifier = createNotifier()

// 작업 완료 알림
await notifier.sendTaskComplete("Build", "Completed in 3.2s")

// 에러 알림
await notifier.sendError("Build failed", "TypeScript errors found")

// 진행 상황 알림
await notifier.sendProgress("Installing", "2/5 packages")

// 커스텀 알림
await notifier.sendCustom({
  title: "Custom",
  message: "Hello",
  sound: "info",
  subtitle: "Subtitle",
})
```

### 독립 함수

```typescript
import {
  sendTaskCompleteNotification,
  sendErrorNotification,
  sendProgressNotification,
} from '@feelso/echo'

await sendTaskCompleteNotification("Deployment", "Successfully deployed")
await sendErrorNotification("API Error", "Connection timeout")
await sendProgressNotification("Processing", "50% complete")
```

### 저수준 API

```typescript
import {
  sendNotification,
  playSound,
} from '@feelso/echo'

// 알림만 보내기
await sendNotification({
  title: "Title",
  message: "Message",
  subtitle: "Subtitle",
  open: "https://example.com",
})

// 사운드만 재생
await playSound({ soundType: "success" })
```

### 설정 로드

```typescript
import { loadConfig } from '@feelso/echo'

const config = await loadConfig()
// 또는 특정 디렉토리에서 검색
const config = await loadConfig("/path/to/project")
```

---

## Platform Support

| 플랫폼 | 알림 | 사운드 | URL 열기 |
|--------|------|--------|----------|
| **macOS** | osascript | afplay | ✅ |
| **Linux** | notify-send | paplay/aplay | ❌ |
| **Windows** | PowerShell Toast | PowerShell | ❌ |

---

## Events

### Claude Code Events

| 이벤트 | 설명 | 기본 사운드 |
|--------|------|-------------|
| `Stop` | 에이전트 작업 완료 | success |
| `Notification` | 사용자 입력 필요 | info |

### OpenCode Events

| 이벤트 | 설명 | 기본 사운드 |
|--------|------|-------------|
| `session.idle` | 세션 유휴 상태 | reminder |
| `session.error` | 세션 오류 | error |
| `session.progress` | 진행 상황 업데이트 | progress |

---

## Examples

### 기본 사용

```json
{
  "sound": true,
  "delay": 1500
}
```

### 이벤트별 사운드

```json
{
  "events": {
    "stop": "success",
    "error": "error"
  }
}
```

### 에러만 알림

```json
{
  "events": {
    "stop": false,
    "idle": false,
    "error": "error"
  }
}
```

### 무음 알림

```json
{
  "sound": "silent"
}
```

### URL 열기 (macOS)

```json
{
  "title": "Task Complete",
  "message": "Click to view logs",
  "open": "file:///var/log/build.log"
}
```

---

## TypeScript Support

모든 타입이 export됩니다:

```typescript
import type {
  NotifierConfig,
  Notifier,
  NotificationOptions,
  SoundType,
  SoundOptions,
  EchoEvent,
  EchoConfig,
} from '@feelso/echo'
```

---

## License

MIT
