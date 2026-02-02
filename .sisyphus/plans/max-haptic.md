# Maximum Haptic Feedback Implementation

## TL;DR

> **Quick Summary**: Louder plugin의 haptic feedback을 최대 강도(actuate(15, 2.0))로 변경하고, plugin-only로 동작하도록 Swift binary를 번들링
> 
> **Deliverables**:
> - Swift binary (`HapticEngine`) with maximum haptic (15, 2.0)
> - Claude Code plugin with bundled binary
> - OpenCode plugin with bundled binary
> - Updated configuration support
> 
> **Estimated Effort**: Medium (2-3 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 4 → Task 6

---

## Context

### Original Request
1. 최대 강도 Haptic 구현 (현재 약함 → 최대로)
2. Plugin-only 사용 (npm 설치 없이)
3. vibe-haptic 참고 (의존성 X, 구현 패턴만)
4. Codex 지원 제외 (나중에)

### Interview Summary
**Key Discussions**:
- Haptic 접근 방식: vibe-haptic과 동일한 기술 (MultitouchSupport.framework)
- 배포 방식: Swift binary (plugin-only)
- NAPI module 제거 (plugin-only 요구사항에 맞춤)

**Research Findings**:
- 최대 강도: `actuate(15, 2.0)` - Actuation ID 15 + intensity 2.0
- OpenCode 플러그인은 이미 최대 강도 사용 중!
- 현재 코드 제거됨 - commit `9cdb8b8`에서 복원 필요
- NAPI module은 npm 필요 → 제거

### Metis Review
**Identified Gaps** (addressed):
- 두 가지 haptic 접근 방식 존재 → Swift binary만 사용하기로 결정
- NAPI module vs Swift binary 선택 → Swift binary (plugin-only)
- Binary 번들링 방법 → plugin 디렉토리에 포함

---

## Work Objectives

### Core Objective
Louder plugin의 haptic feedback을 최대 강도(15, 2.0)로 구현하고, npm 설치 없이 plugin만으로 동작하도록 Swift binary를 번들링

### Concrete Deliverables
- `native/HapticEngine.swift` - 복원 및 검증
- `native/HapticEngine` - Universal binary (arm64 + x86_64)
- `opencode-plugin/louder.js` - 복원 (이미 최대 강도)
- `hooks/louder-hook.js` - Claude Code hook 복원
- `.claude-plugin/` - Binary 번들 경로 설정

### Definition of Done
- [ ] `echo "15,2.0" | ./native/HapticEngine` → 최대 강도 haptic 느껴짐
- [ ] OpenCode plugin 로드 시 haptic 동작
- [ ] Claude Code hook 실행 시 haptic 동작
- [ ] NAPI module 파일 없음 (plugin-only)

### Must Have
1. Swift binary 복원 및 빌드
2. 최대 강도 haptic (15, 2.0)
3. Plugin-only 동작 (no npm)
4. Claude Code + OpenCode 지원

### Must NOT Have (Guardrails)
- ❌ NAPI module (`vibe-haptic-native.node`) 복원 - plugin-only 위배
- ❌ Codex 지원 - 명시적 제외
- ❌ Sound 동작 변경 - haptic만 수정
- ❌ Event trigger 변경 - 기존 동작 유지
- ❌ 사용자 빌드 요구 - pre-built binary 제공

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (haptic은 physical feedback)
- **User wants tests**: Manual-only
- **Framework**: Physical verification required

### Manual Verification Procedures

**By Deliverable Type: TUI/CLI + Physical**

각 TODO는 agent가 실행할 수 있는 자동 검증 + 수동 확인 포함:

**Automated Checks** (agent executes):
```bash
# Binary exists and is universal
file native/HapticEngine | grep "universal binary"

# Binary is executable
test -x native/HapticEngine && echo "PASS"

# No NAPI module
! test -f native/vibe-haptic-native.node && echo "No NAPI: PASS"

# Plugin files exist
test -f opencode-plugin/louder.js && echo "OpenCode plugin: PASS"
test -f hooks/louder-hook.js && echo "Claude hook: PASS"
```

**Physical Verification** (user confirms):
- 손가락을 트랙패드에 올린 상태에서 haptic 실행
- 최대 강도의 강한 진동 확인

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Restore Swift source files from 9cdb8b8
└── Task 3: Restore plugin files from 9cdb8b8

Wave 2 (After Wave 1):
├── Task 2: Build universal binary (depends: 1)
└── Task 4: Verify haptic values in plugins (depends: 3)

Wave 3 (After Wave 2):
├── Task 5: Bundle binary with plugins (depends: 2, 4)
└── Task 6: Integration test (depends: 5)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | 3 |
| 2 | 1 | 5 | 4 |
| 3 | None | 4 | 1 |
| 4 | 3 | 5 | 2 |
| 5 | 2, 4 | 6 | None |
| 6 | 5 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 3 | `delegate_task(category="quick", load_skills=["git-master"], run_in_background=true)` |
| 2 | 2, 4 | dispatch parallel after Wave 1 completes |
| 3 | 5, 6 | final integration |

---

## TODOs

### Wave 1 (Parallel Start)

- [x] 1. Restore Swift Binary Source Files

  **What to do**:
  - Restore `native/HapticEngine.swift` from commit `9cdb8b8`
  - Restore `native/build.sh` from commit `9cdb8b8`
  - Verify haptic uses actuate(15, 2.0) or update if needed

  **Must NOT do**:
  - Restore NAPI module files
  - Modify Swift code beyond haptic intensity

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple git restore operation
  - **Skills**: [`git-master`]
    - `git-master`: Git operations for file restoration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - `git show 9cdb8b8:native/HapticEngine.swift` - Swift source to restore
  - `git show 9cdb8b8:native/build.sh` - Build script to restore
  
  **Pattern References**:
  - vibe-haptic `lib.rs:199-211` - actuate(15, 1.0) strong click pattern

  **Acceptance Criteria**:

  ```bash
  # Agent executes:
  test -f native/HapticEngine.swift && echo "Swift source: PASS"
  test -f native/build.sh && echo "Build script: PASS"
  grep -q "MTActuatorActuate" native/HapticEngine.swift && echo "API usage: PASS"
  ```

  **Commit**: NO (groups with Task 3)

---

- [x] 3. Restore Plugin Files

  **What to do**:
  - Restore `opencode-plugin/louder.js` from commit `9cdb8b8`
  - Restore `hooks/louder-hook.js` from commit `9cdb8b8`
  - Restore `src/core/sound.ts` (for sound support, no haptic)

  **Must NOT do**:
  - Restore `src/core/haptic.ts` (NAPI module approach)
  - Restore `vibe-haptic-native.node`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple git restore operation
  - **Skills**: [`git-master`]
    - `git-master`: Git operations for file restoration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  - `git show 9cdb8b8:opencode-plugin/louder.js` - OpenCode plugin
  - `git show 9cdb8b8:hooks/louder-hook.js` - Claude Code hook
  - Metis analysis: OpenCode plugin already uses `15,2.0` for max haptic

  **Acceptance Criteria**:

  ```bash
  # Agent executes:
  test -f opencode-plugin/louder.js && echo "OpenCode plugin: PASS"
  test -f hooks/louder-hook.js && echo "Claude hook: PASS"
  grep -q "HapticEngine" opencode-plugin/louder.js && echo "Binary spawn: PASS"
  ```

  **Commit**: NO (groups with Task 1)

---

### Wave 2 (After Wave 1)

- [x] 2. Build Universal Binary

  **What to do**:
  - Run `./native/build.sh` to compile HapticEngine
  - Verify universal binary (arm64 + x86_64)
  - Ensure binary is executable

  **Must NOT do**:
  - Modify Swift source (already done in Task 1)
  - Build NAPI module

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single build command
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:
  - `native/build.sh` - Build script (restored in Task 1)
  - vibe-haptic build approach: universal binary for arm64 + x86_64

  **Acceptance Criteria**:

  ```bash
  # Agent executes:
  cd native && chmod +x build.sh && ./build.sh
  file native/HapticEngine | grep -q "universal binary" && echo "Universal: PASS"
  test -x native/HapticEngine && echo "Executable: PASS"
  ls -la native/HapticEngine | awk '{print $5}'  # Should be ~50KB
  ```

  **Commit**: NO (groups with Task 4)

---

- [x] 4. Verify and Update Haptic Values

  **What to do**:
  - Verify `opencode-plugin/louder.js` uses `15,2.0` (already should)
  - Verify `hooks/louder-hook.js` uses actuation 15 and intensity 2.0
  - Update if any values are not maximum

  **Must NOT do**:
  - Change event triggers
  - Modify sound settings

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple grep and potentially minor edit
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References**:
  - `opencode-plugin/louder.js:58-72` - Binary spawn with haptic values
  - `hooks/louder-hook.js` - ACTUATION_STRONG and DEFAULT_INTENSITY constants
  - Metis finding: Should already have `15,2.0`

  **Acceptance Criteria**:

  ```bash
  # Agent executes:
  grep -n "15" opencode-plugin/louder.js  # Should show actuation ID
  grep -n "2.0" opencode-plugin/louder.js  # Should show intensity
  grep -n "ACTUATION_STRONG" hooks/louder-hook.js  # Should be 15
  grep -n "DEFAULT_INTENSITY" hooks/louder-hook.js  # Should be 2.0
  ```

  **Commit**: YES
  - Message: `feat(haptic): restore maximum intensity haptic (15, 2.0)`
  - Files: `native/`, `opencode-plugin/`, `hooks/`
  - Pre-commit: `file native/HapticEngine`

---

### Wave 3 (After Wave 2)

- [x] 5. Bundle Binary with Plugins

  **What to do**:
  - Ensure binary is in correct location for OpenCode plugin
  - Ensure binary is in correct location for Claude Code plugin
  - Update plugin paths if needed

  **Must NOT do**:
  - Require user to download binary separately
  - Add npm dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Path configuration
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 6
  - **Blocked By**: Task 2, Task 4

  **References**:
  - `opencode-plugin/louder.js:findBinary()` - Binary search logic
  - `.claude-plugin/plugin.json` - Claude Code manifest

  **Acceptance Criteria**:

  ```bash
  # Agent executes:
  # Verify OpenCode plugin can find binary
  grep -A5 "findBinary" opencode-plugin/louder.js
  
  # Verify binary exists in expected location
  ls -la native/HapticEngine
  
  # Verify plugin.json points to correct location
  cat .claude-plugin/plugin.json | grep -A5 "hooks"
  ```

  **Commit**: YES (if changes needed)
  - Message: `fix(plugin): update binary paths for plugin-only distribution`
  - Files: Modified plugin files only

---

- [x] 6. Integration Test

  **What to do**:
  - Test haptic via direct binary call
  - Verify no NAPI module exists
  - Document physical verification steps

  **Must NOT do**:
  - Skip physical verification
  - Claim completion without evidence

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification commands
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final)
  - **Blocks**: None
  - **Blocked By**: Task 5

  **References**:
  - All previous tasks

  **Acceptance Criteria**:

  ```bash
  # Agent executes ALL:
  
  # 1. Binary format check
  file native/HapticEngine | grep -q "universal binary" && echo "Binary format: PASS"
  
  # 2. Executable permission
  test -x native/HapticEngine && echo "Executable: PASS"
  
  # 3. No NAPI module
  ! test -f native/vibe-haptic-native.node && echo "No NAPI: PASS"
  ! test -f src/core/haptic.ts && echo "No haptic.ts: PASS"
  
  # 4. Plugin files exist
  test -f opencode-plugin/louder.js && echo "OpenCode: PASS"
  test -f hooks/louder-hook.js && echo "Claude hook: PASS"
  
  # 5. Haptic test (requires physical verification)
  echo "15,2.0" | ./native/HapticEngine
  echo ">>> Place finger on trackpad and run above command to feel maximum haptic <<<"
  ```

  **Physical Verification (User Must Confirm)**:
  - [ ] 손가락을 트랙패드에 올린 상태에서 `echo "15,2.0" | ./native/HapticEngine` 실행
  - [ ] 강한 진동 느껴짐 (최대 강도)

  **Commit**: YES
  - Message: `docs: update README with plugin-only installation`
  - Files: `README.md` (if needed)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 4 | `feat(haptic): restore maximum intensity haptic (15, 2.0)` | native/, opencode-plugin/, hooks/ | `file native/HapticEngine` |
| 5 | `fix(plugin): update binary paths for plugin-only distribution` | plugin files | `grep findBinary` |
| 6 | `docs: update README with plugin-only installation` | README.md | Manual review |

---

## Success Criteria

### Verification Commands
```bash
# All must pass:
file native/HapticEngine | grep "universal binary"  # Expected: Mach-O universal binary
test -x native/HapticEngine && echo "PASS"           # Expected: PASS
! test -f native/vibe-haptic-native.node && echo "PASS"  # Expected: PASS (no NAPI)
test -f opencode-plugin/louder.js && echo "PASS"     # Expected: PASS
test -f hooks/louder-hook.js && echo "PASS"          # Expected: PASS
```

### Final Checklist
- [ ] All "Must Have" present
  - [ ] Swift binary restored and built
  - [ ] Maximum haptic (15, 2.0)
  - [ ] Plugin-only (no npm)
  - [ ] Claude Code + OpenCode support
- [ ] All "Must NOT Have" absent
  - [ ] No NAPI module
  - [ ] No Codex support
  - [ ] No sound changes
- [ ] Physical test passed (user confirms haptic felt)
