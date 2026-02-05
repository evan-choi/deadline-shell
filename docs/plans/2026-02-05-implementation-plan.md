# DEADLINE SHELL 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 튜토리얼 → 커맨드 확장 → 랜덤 이벤트 → 메타 진행 → 맵 시스템 순서로 게임 완성

**Architecture:** 기존 Game.js 확장 + 모듈 분리 (Tutorial, Commands, Events, Meta, Map)

**Tech Stack:** Vanilla JS, Vite, DOM + Canvas

**언어 규칙:** 커맨드는 영어, 모든 설명/로그/힌트는 한글

---

## 전체 Phase 구성

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | 튜토리얼 시스템 (스토리 로그 + 힌트) | ✅ 완료 |
| 1 | 커맨드 확장 (repair, 권한, 목표) | 🔄 진행중 |
| 2 | 랜덤 이벤트 시스템 | ⏳ 대기 |
| 3 | 메타 진행 (DATA + 상점) | ⏳ 대기 |
| 4 | 맵 연결 + 이동 제약 | ⏳ 대기 |

---

## Phase 0: 튜토리얼 시스템 ✅ 완료

- `src/game/messages.js` - 한글 메시지 모듈
- `src/game/Tutorial.js` - 힌트 시스템
- `src/game/Game.js` - 한글화 + 튜토리얼 연동

---

## Phase 1: 커맨드 확장 + 권한 시스템

### 목표
- 권한 시스템 (guest → engineer → admin)
- repair 커맨드 (engineer 이상)
- 목표 시스템 (3개 중 2개 완료 시 탈출)
- login/su 커맨드
- 타이핑 챌린지 (repair 시)

### 파일 구조
```
src/
├── game/
│   ├── Game.js (수정)
│   ├── Objectives.js (신규)
│   ├── TypingChallenge.js (신규)
│   └── messages.js (수정)
```

---

### Task 1-1: 목표 시스템 모듈

**Files:**
- Create: `src/game/Objectives.js`

### Task 1-2: 타이핑 챌린지 모듈

**Files:**
- Create: `src/game/TypingChallenge.js`

### Task 1-3: 권한 + repair + login/su 커맨드

**Files:**
- Modify: `src/game/Game.js`
- Modify: `src/game/messages.js`

---
