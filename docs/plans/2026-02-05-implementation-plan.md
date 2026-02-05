# DEADLINE SHELL 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 튜토리얼 → 커맨드 확장 → 랜덤 이벤트 → 메타 진행 → 맵 시스템 순서로 게임 완성

**Architecture:** 기존 Game.js 확장 + 모듈 분리 (Tutorial, Commands, Events, Meta, Map)

**Tech Stack:** Vanilla JS, Vite, DOM + Canvas

**언어 규칙:** 커맨드는 영어, 모든 설명/로그/힌트는 한글

---

## 전체 Phase 구성

| Phase | 내용 | 예상 시간 |
|-------|------|----------|
| 0 | 튜토리얼 시스템 (스토리 로그 + 힌트) | 30분 |
| 1 | 커맨드 확장 (repair, hide, lock 등) | 45분 |
| 2 | 랜덤 이벤트 시스템 | 30분 |
| 3 | 메타 진행 (DATA + 상점) | 45분 |
| 4 | 맵 연결 + 이동 제약 | 30분 |

---

## Phase 0: 튜토리얼 시스템

### 목표
- 첫 부팅 시 스토리 로그로 상황 설명 + 첫 목표 자연스럽게 제시
- 막히면 힌트가 자동으로 뜸 (10초 무입력 또는 연속 3회 오류)
- 모든 메시지 한글화 (커맨드만 영어)

### 파일 구조
```
src/
├── game/
│   ├── Game.js (수정)
│   ├── Tutorial.js (신규)
│   └── messages.js (신규 - 한글 메시지)
```

---

### Task 0-1: 한글 메시지 모듈 생성

**Files:**
- Create: `src/game/messages.js`

**코드:**
```javascript
/**
 * 한글 메시지 모음 - 커맨드는 영어, 설명은 한글
 */

export const MSG = {
  // 시스템
  WELCOME: 'DEADLINE SHELL v0.1.0',
  BOOT_SEQUENCE: '시스템 부팅 중...',
  
  // 첫 부팅 스토리 (튜토리얼)
  STORY_INTRO: [
    '[ 비상 시스템 로그 ]',
    '',
    '경고: 생명유지장치 손상 감지',
    '경고: 미확인 생명체 탐지',
    '',
    '당신은 우주정거장에서 깨어났습니다.',
    '산소가 새고 있고, 무언가가 당신을 추적하고 있습니다.',
    '탈출구를 찾아야 합니다.',
    '',
    '---',
    '',
  ],
  STORY_FIRST_TIP: '[시스템] 현재 상태를 확인하려면 status 를 입력하세요.',
  
  // 커맨드 도움말
  HELP_HEADER: '사용 가능한 명령어:',
  HELP_CMDS: {
    help: '이 도움말을 표시합니다',
    status: '현재 상태를 확인합니다',
    scan: '주변을 스캔합니다 (소음 +2)',
    ls: '현재 방의 물건을 확인합니다',
    cd: '다른 방으로 이동합니다 (예: cd reactor)',
    map: '정거장 지도를 표시합니다',
    logs: '시스템 로그를 확인합니다',
  },
  
  // 상태
  STATUS_LOCATION: '위치',
  STATUS_PERMISSION: '권한',
  
  // 스캔
  SCAN_START: '스캔 중...',
  SCAN_ENEMY_FAR: '적 탐지: 멀리 있음',
  SCAN_ENEMY_APPROACHING: '적 탐지: 접근 중',
  SCAN_ENEMY_NEAR: '경고: 적이 가까이 있음!',
  SCAN_ENEMY_CRITICAL: '위험: 적이 매우 가까움!!',
  
  // 이동
  MOVE_SUCCESS: (room) => `${room}(으)로 이동했습니다`,
  MOVE_UNKNOWN: (room) => `알 수 없는 장소: ${room}`,
  MOVE_LOCKED: (room) => `${room}은(는) 잠겨 있습니다`,
  MOVE_USAGE: '사용법: cd <장소>',
  
  // 에러
  CMD_NOT_FOUND: (cmd) => `명령어를 찾을 수 없음: ${cmd}`,
  PERMISSION_DENIED: '권한이 부족합니다',
  
  // 힌트 (10초 무입력 또는 연속 오류 시)
  HINTS: {
    START: '[TIP] status 를 입력해 현재 상태를 확인해보세요',
    AFTER_STATUS: '[TIP] scan 으로 주변을 살펴보세요',
    AFTER_SCAN: '[TIP] cd <장소> 로 다른 방으로 이동할 수 있습니다',
    LOW_O2: '[TIP] 산소가 부족합니다! 서둘러 이동하세요',
    ENEMY_NEAR: '[TIP] 적이 가깝습니다. hide 로 숨거나 빠르게 이동하세요',
    STUCK: '[TIP] help 를 입력하면 사용 가능한 명령어를 볼 수 있습니다',
  },
  
  // 게임 오버
  GAME_OVER: '========== 게임 오버 ==========',
  DEATH_O2: '산소 부족으로 사망했습니다.',
  DEATH_HP: '사망했습니다.',
  DEATH_ENEMY: '추적자에게 발각되었습니다.',
  RETRY: '다시 시도하려면 새로고침하세요.',
};
```

**Commit:** `feat: add Korean message module`

---

### Task 0-2: 튜토리얼 모듈 생성

**Files:**
- Create: `src/game/Tutorial.js`

**코드:**
```javascript
/**
 * Tutorial - 힌트 시스템 (B+C 혼합)
 */

import { MSG } from './messages.js';

export class Tutorial {
  constructor(game) {
    this.game = game;
    this.enabled = true;
    this.phase = 'start'; // start, after_status, after_scan, exploring
    this.lastInputTime = Date.now();
    this.errorCount = 0;
    this.hintShown = false;
    
    // 10초마다 힌트 체크
    this.hintInterval = setInterval(() => this.checkHint(), 10000);
  }
  
  /**
   * 첫 부팅 시 스토리 출력
   */
  showIntro() {
    MSG.STORY_INTRO.forEach(line => {
      this.game.print(line, line.startsWith('경고') ? 'warning' : 'system');
    });
    
    setTimeout(() => {
      this.game.print(MSG.STORY_FIRST_TIP, 'system');
    }, 1000);
  }
  
  /**
   * 커맨드 실행 후 phase 업데이트
   */
  onCommand(cmd) {
    this.lastInputTime = Date.now();
    this.errorCount = 0;
    this.hintShown = false;
    
    if (cmd === 'status' && this.phase === 'start') {
      this.phase = 'after_status';
    } else if (cmd === 'scan' && this.phase === 'after_status') {
      this.phase = 'after_scan';
    } else if (cmd === 'cd' && this.phase === 'after_scan') {
      this.phase = 'exploring';
    }
  }
  
  /**
   * 에러 발생 시
   */
  onError() {
    this.errorCount++;
    if (this.errorCount >= 3 && !this.hintShown) {
      this.showHint(MSG.HINTS.STUCK);
    }
  }
  
  /**
   * 주기적 힌트 체크
   */
  checkHint() {
    if (!this.enabled || this.hintShown) return;
    
    const idle = Date.now() - this.lastInputTime;
    if (idle < 10000) return;
    
    const { resources, enemy } = this.game.state;
    
    // 상황별 힌트
    if (resources.o2 < 30) {
      this.showHint(MSG.HINTS.LOW_O2);
    } else if (enemy.distance <= 2) {
      this.showHint(MSG.HINTS.ENEMY_NEAR);
    } else {
      // phase별 힌트
      const hints = {
        start: MSG.HINTS.START,
        after_status: MSG.HINTS.AFTER_SCAN,
        after_scan: MSG.HINTS.AFTER_SCAN,
      };
      if (hints[this.phase]) {
        this.showHint(hints[this.phase]);
      }
    }
  }
  
  showHint(msg) {
    this.hintShown = true;
    this.game.print(msg, 'system');
  }
  
  destroy() {
    clearInterval(this.hintInterval);
  }
}
```

**Commit:** `feat: add Tutorial module with hint system`

---

### Task 0-3: Game.js 수정 - 메시지 한글화 + 튜토리얼 연동

**Files:**
- Modify: `src/game/Game.js`

**주요 변경:**
1. `messages.js` import
2. `Tutorial` 연동
3. 모든 출력을 MSG 상수로 교체
4. `cmdHelp()` 한글화
5. `cmdStatus()` 한글화
6. `cmdScan()` 거리별 한글 메시지
7. `cmdCd()` 한글화
8. `gameOver()` 한글화

**Commit:** `feat: integrate Korean messages and tutorial`

---
