/**
 * Events - 랜덤 이벤트 시스템
 * 런당 2~4회 발생, 긴장감 + 변주 제공
 */

import { MSG } from './messages.js';

export class Events {
  constructor(game) {
    this.game = game;
    
    // 이벤트 발생 카운터
    this.eventCount = 0;
    this.maxEvents = 4;
    this.minEvents = 2;
    
    // 현재 활성 이벤트
    this.activeEvents = new Map();
    
    // 이벤트 정의
    this.eventTypes = {
      blackout: {
        id: 'blackout',
        name: '정전',
        nameEn: 'BLACKOUT',
        probability: 0.08, // 틱당 8%
        duration: 5, // 5틱 지속
        onTrigger: () => this.triggerBlackout(),
        onTick: () => this.tickBlackout(),
        onEnd: () => this.endBlackout(),
      },
      o2Leak: {
        id: 'o2Leak',
        name: '산소 누출',
        nameEn: 'O2 LEAK',
        probability: 0.06,
        duration: 8,
        rooms: ['reactor', 'storage', 'airlock'], // 발생 가능 방
        onTrigger: () => this.triggerO2Leak(),
        onTick: () => this.tickO2Leak(),
        onEnd: () => this.endO2Leak(),
      },
      noiseSpike: {
        id: 'noiseSpike',
        name: '소음 감지',
        nameEn: 'NOISE SPIKE',
        probability: 0.05,
        duration: 6,
        condition: () => this.game.state.resources.noise >= 50,
        onTrigger: () => this.triggerNoiseSpike(),
        onTick: () => this.tickNoiseSpike(),
        onEnd: () => this.endNoiseSpike(),
      },
      systemGlitch: {
        id: 'systemGlitch',
        name: '시스템 오류',
        nameEn: 'SYS GLITCH',
        probability: 0.04,
        duration: 4,
        onTrigger: () => this.triggerSystemGlitch(),
        onTick: () => {},
        onEnd: () => this.endSystemGlitch(),
      },
      powerSurge: {
        id: 'powerSurge',
        name: '전력 급증',
        nameEn: 'POWER SURGE',
        probability: 0.05,
        duration: 1, // 즉시
        onTrigger: () => this.triggerPowerSurge(),
        onTick: () => {},
        onEnd: () => {},
      },
    };
    
    // 글리치 상태
    this.glitchActive = false;
    this.glitchNextCommand = false;
  }
  
  /**
   * 매 틱마다 호출 - 이벤트 발생 체크 + 활성 이벤트 틱
   */
  tick() {
    // 활성 이벤트 틱 처리
    for (const [id, event] of this.activeEvents) {
      event.remaining--;
      event.onTick();
      
      if (event.remaining <= 0) {
        event.onEnd();
        this.activeEvents.delete(id);
      }
    }
    
    // 새 이벤트 발생 체크 (최대치 미만일 때만)
    if (this.eventCount < this.maxEvents) {
      this.checkNewEvent();
    }
  }
  
  /**
   * 새 이벤트 발생 체크
   */
  checkNewEvent() {
    for (const eventType of Object.values(this.eventTypes)) {
      // 이미 활성 중이면 스킵
      if (this.activeEvents.has(eventType.id)) continue;
      
      // 조건 체크
      if (eventType.condition && !eventType.condition()) continue;
      
      // 방 제한 체크
      if (eventType.rooms && !eventType.rooms.includes(this.game.state.location)) continue;
      
      // 확률 체크
      if (Math.random() < eventType.probability) {
        this.triggerEvent(eventType);
        break; // 한 틱에 하나만
      }
    }
  }
  
  /**
   * 이벤트 발생
   */
  triggerEvent(eventType) {
    this.eventCount++;
    
    this.activeEvents.set(eventType.id, {
      ...eventType,
      remaining: eventType.duration,
    });
    
    // CRT 글리치 효과
    this.game.crt.glitch(300);
    
    eventType.onTrigger();
  }
  
  // ==================== 정전 ====================
  
  triggerBlackout() {
    this.game.print('');
    this.game.print('⚡ [경고] 정전 발생!', 'error');
    this.game.print('전력이 급감합니다. scan 명령이 일시적으로 비활성화됩니다.', 'warning');
    this.game.print('');
    
    this.game.state.resources.power = Math.max(0, this.game.state.resources.power - 15);
  }
  
  tickBlackout() {
    // 정전 중 추가 전력 소모
    this.game.state.resources.power = Math.max(0, this.game.state.resources.power - 1);
  }
  
  endBlackout() {
    this.game.print('');
    this.game.print('[시스템] 전력 복구됨.', 'success');
    this.game.print('');
  }
  
  /**
   * 정전 중인지 확인
   */
  isBlackout() {
    return this.activeEvents.has('blackout');
  }
  
  // ==================== 산소 누출 ====================
  
  triggerO2Leak() {
    const roomKr = MSG.ROOMS[this.game.state.location];
    
    this.game.print('');
    this.game.print('💨 [경고] 산소 누출 감지!', 'error');
    this.game.print(`${roomKr}에서 산소가 빠르게 새고 있습니다!`, 'warning');
    this.game.print('repair vent 또는 다른 방으로 이동하세요.', 'system');
    this.game.print('');
    
    this.leakRoom = this.game.state.location;
  }
  
  tickO2Leak() {
    // 누출 방에 있으면 O2 추가 감소
    if (this.game.state.location === this.leakRoom) {
      this.game.state.resources.o2 = Math.max(0, this.game.state.resources.o2 - 2);
    }
  }
  
  endO2Leak() {
    this.game.print('');
    this.game.print('[시스템] 산소 누출 자동 봉쇄됨.', 'success');
    this.game.print('');
    this.leakRoom = null;
  }
  
  /**
   * 산소 누출 방 확인
   */
  getLeakRoom() {
    return this.activeEvents.has('o2Leak') ? this.leakRoom : null;
  }
  
  // ==================== 소음 감지 ====================
  
  triggerNoiseSpike() {
    this.game.print('');
    this.game.print('📡 [경고] 소음 급증 감지!', 'error');
    this.game.print('추적자가 더 빠르게 접근합니다!', 'warning');
    this.game.print('');
  }
  
  tickNoiseSpike() {
    // 적 이동 가속 (기본 3틱당 1칸 → 2틱당 1칸)
    if (this.game.state.time % 2 === 0) {
      this.game.state.enemy.distance = Math.max(0, this.game.state.enemy.distance - 1);
    }
  }
  
  endNoiseSpike() {
    this.game.print('');
    this.game.print('[시스템] 추적자 속도 정상화.', 'success');
    this.game.print('');
  }
  
  /**
   * 소음 급증 중인지
   */
  isNoiseSpike() {
    return this.activeEvents.has('noiseSpike');
  }
  
  // ==================== 시스템 오류 ====================
  
  triggerSystemGlitch() {
    this.game.print('');
    this.game.print('🔧 [경고] 시스템 오류!', 'error');
    this.game.print('다음 명령이 실패할 수 있습니다.', 'warning');
    this.game.print('');
    
    this.glitchActive = true;
    this.glitchNextCommand = true;
  }
  
  endSystemGlitch() {
    this.game.print('');
    this.game.print('[시스템] 시스템 안정화됨.', 'success');
    this.game.print('');
    
    this.glitchActive = false;
    this.glitchNextCommand = false;
  }
  
  /**
   * 글리치로 명령 실패 체크 (30% 확률)
   * @returns {boolean} true면 명령 실패
   */
  checkGlitchFail() {
    if (this.glitchActive && this.glitchNextCommand) {
      this.glitchNextCommand = false;
      if (Math.random() < 0.3) {
        this.game.print('[오류] 시스템 불안정으로 명령 실패!', 'error');
        this.game.triggerError();
        return true;
      }
    }
    return false;
  }
  
  // ==================== 전력 급증 ====================
  
  triggerPowerSurge() {
    this.game.print('');
    this.game.print('⚡ [이벤트] 전력 급증!', 'warning');
    
    // 50% 확률로 좋거나 나쁨
    if (Math.random() < 0.5) {
      const bonus = 10 + Math.floor(Math.random() * 10);
      this.game.state.resources.power = Math.min(100, this.game.state.resources.power + bonus);
      this.game.print(`전력이 +${bonus} 충전되었습니다!`, 'success');
    } else {
      const damage = 5 + Math.floor(Math.random() * 10);
      this.game.state.resources.power = Math.max(0, this.game.state.resources.power - damage);
      this.game.state.resources.noise = Math.min(100, this.game.state.resources.noise + 10);
      this.game.print(`전력 과부하로 -${damage} 손실, 소음 +10`, 'error');
    }
    
    this.game.print('');
  }
  
  // ==================== 유틸리티 ====================
  
  /**
   * 현재 활성 이벤트 목록
   */
  getActiveEvents() {
    return Array.from(this.activeEvents.values()).map(e => ({
      name: e.name,
      remaining: e.remaining,
    }));
  }
  
  /**
   * 이벤트 상태 출력 (status 명령에 추가 가능)
   */
  showStatus() {
    const active = this.getActiveEvents();
    if (active.length > 0) {
      this.game.print('');
      this.game.print('=== 활성 이벤트 ===', 'warning');
      for (const event of active) {
        this.game.print(`  ⚠ ${event.name} (${event.remaining}초 남음)`, 'warning');
      }
    }
  }
}
