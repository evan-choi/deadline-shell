/**
 * Events - 랜덤 이벤트 시스템
 * 런당 2~4회 발생, 긴장감 + 변주 제공
 */

import { MSG } from './messages.js';

export class Events {
  constructor(game) {
    this.game = game;
    
    // 이벤트 정의
    this.eventTypes = {
      blackout: {
        id: 'blackout',
        name: '정전',
        message: '⚡ [경고] 정전 발생! 전력이 급감합니다.',
        effect: (g) => {
          g.state.resources.power = Math.max(0, g.state.resources.power - 20);
          this.disableScanFor(3);
        },
        duration: 3,
        positive: false,
      },
      o2leak: {
        id: 'o2leak',
        name: '산소 누출',
        message: '💨 [경고] 산소 누출 감지! 이 구역의 산소가 빠르게 감소합니다.',
        effect: (g) => {
          this.activeO2Leak = true;
          this.o2LeakRoom = g.state.location;
        },
        duration: 10,
        positive: false,
      },
      noisespike: {
        id: 'noisespike',
        name: '소음 감지',
        message: '📡 [경고] 소음 스파이크! 적이 빠르게 접근합니다.',
        effect: (g) => {
          g.state.enemy.distance = Math.max(0, g.state.enemy.distance - 1);
          g.state.resources.noise = Math.min(100, g.state.resources.noise + 20);
        },
        duration: 0,
        positive: false,
      },
      glitch: {
        id: 'glitch',
        name: '시스템 오류',
        message: '🔧 [경고] 시스템 글리치! 다음 명령이 불안정합니다.',
        effect: (g) => {
          this.nextCommandMayFail = true;
        },
        duration: 0,
        positive: false,
      },
      powersurge: {
        id: 'powersurge',
        name: '전력 서지',
        message: '⚡ [알림] 예비 전력 공급! 전력이 회복됩니다.',
        effect: (g) => {
          g.state.resources.power = Math.min(100, g.state.resources.power + 15);
        },
        duration: 0,
        positive: true,
      },
    };
    
    // 상태
    this.eventCount = 0;
    this.maxEvents = 4;
    this.minTicksBetweenEvents = 15;
    this.lastEventTick = 0;
    
    // 활성 효과
    this.scanDisabledUntil = 0;
    this.activeO2Leak = false;
    this.o2LeakRoom = null;
    this.o2LeakEndTick = 0;
    this.nextCommandMayFail = false;
  }
  
  /**
   * 매 틱마다 호출
   */
  tick() {
    const { time } = this.game.state;
    
    // O2 누출 효과 (해당 방에 있으면 추가 드레인)
    if (this.activeO2Leak) {
      if (time >= this.o2LeakEndTick) {
        this.activeO2Leak = false;
        // 시스템 로그에 복구 메시지
        if (this.game.leftPanel) {
          this.game.leftPanel.logEvent('💨 산소 누출이 멈췄습니다.', 'success');
        }
      } else if (this.game.state.location === this.o2LeakRoom) {
        this.game.state.resources.o2 = Math.max(0, this.game.state.resources.o2 - 1);
      }
    }
    
    // 랜덤 이벤트 발생 체크
    this.checkRandomEvent();
    
    // 활성 효과 업데이트 (좌측 패널)
    if (this.game.leftPanel) {
      this.game.leftPanel.updateEffects(this.getActiveEffects());
    }
  }
  
  /**
   * 랜덤 이벤트 발생 체크
   */
  checkRandomEvent() {
    const { time, resources, enemy } = this.game.state;
    
    // 이미 최대치 도달
    if (this.eventCount >= this.maxEvents) return;
    
    // 최소 간격 체크
    if (time - this.lastEventTick < this.minTicksBetweenEvents) return;
    
    // 초반(30초)에는 이벤트 없음
    if (time < 30) return;
    
    // 발생 확률 (기본 3%, 소음 높으면 증가)
    let chance = 0.03;
    if (resources.noise > 50) chance += 0.02;
    if (resources.noise > 80) chance += 0.03;
    if (enemy.distance <= 2) chance += 0.02;
    
    if (Math.random() < chance) {
      this.triggerRandomEvent();
    }
  }
  
  /**
   * 랜덤 이벤트 발생
   */
  triggerRandomEvent() {
    // 이벤트 선택 (가중치)
    const weights = {
      blackout: 25,
      o2leak: 20,
      noisespike: 25,
      glitch: 20,
      powersurge: 10,
    };
    
    const eventId = this.weightedRandom(weights);
    const event = this.eventTypes[eventId];
    
    if (!event) return;
    
    this.eventCount++;
    this.lastEventTick = this.game.state.time;
    
    // 좌측 패널에 로그 출력 (터미널 대신)
    if (this.game.leftPanel) {
      this.game.leftPanel.logEvent(event.message, event.positive ? 'success' : 'warning');
    } else {
      // Fallback
      this.game.print('');
      this.game.print(event.message, event.positive ? 'success' : 'warning');
      this.game.print('');
    }
    
    // 효과 적용
    event.effect(this.game);
    
    // 지속 시간 설정
    if (event.id === 'o2leak') {
      this.o2LeakEndTick = this.game.state.time + event.duration;
    }
    
    // CRT 글리치 효과 (시각적 피드백은 유지)
    if (!event.positive) {
      this.game.crt.glitch(400);
      // 터미널 흔들림 효과만 (에러 메시지는 패널로 갔으니)
      this.game.terminalEl.classList.add('error-flash');
      setTimeout(() => this.game.terminalEl.classList.remove('error-flash'), 200);
    }
  }
  
  /**
   * 가중치 랜덤 선택
   */
  weightedRandom(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    
    for (const [key, weight] of Object.entries(weights)) {
      rand -= weight;
      if (rand <= 0) return key;
    }
    
    return Object.keys(weights)[0];
  }
  
  /**
   * scan 일시 비활성화
   */
  disableScanFor(seconds) {
    this.scanDisabledUntil = this.game.state.time + seconds;
  }
  
  /**
   * 정전 여부 확인
   */
  isBlackout() {
    return this.game.state.time < this.scanDisabledUntil;
  }
  
  /**
   * scan 가능 여부 (호출처에서 메시지 출력)
   */
  canScan() {
    if (this.isBlackout()) {
      const remaining = this.scanDisabledUntil - this.game.state.time;
      // 터미널에는 "실패" 메시지만 간단히
      return false;
    }
    return true;
  }
  
  /**
   * 누출 방 확인
   */
  getLeakRoom() {
    return this.activeO2Leak ? this.o2LeakRoom : null;
  }
  
  /**
   * 명령 실패 체크 (글리치 이벤트)
   */
  checkGlitchFail() {
    if (this.nextCommandMayFail) {
      this.nextCommandMayFail = false;
      if (Math.random() < 0.3) {
        if (this.game.leftPanel) {
          this.game.leftPanel.logEvent('🔧 시스템 오류로 명령 실행 실패!', 'error');
        } else {
          this.game.print('🔧 시스템 오류로 명령 실행 실패!', 'error');
        }
        this.game.triggerError();
        return true;
      }
    }
    return false;
  }
  
  /**
   * 현재 활성 이벤트 상태 반환
   */
  getActiveEffects() {
    const effects = [];
    
    if (this.game.state.time < this.scanDisabledUntil) {
      effects.push('스캔 불가 (정전)');
    }
    
    if (this.activeO2Leak) {
      effects.push(`산소 누출 (${MSG.ROOMS[this.o2LeakRoom]})`);
    }
    
    if (this.nextCommandMayFail) {
      effects.push('시스템 불안정');
    }
    
    return effects;
  }
  
  // 구버전 메서드 유지 (호환성)
  showStatus() {
    // 이제 LeftPanel이 담당하므로 비워둠
  }
}
