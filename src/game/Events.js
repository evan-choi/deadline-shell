/**
 * Events - 랜덤 이벤트 시스템
 * 이벤트 상태를 좌측 패널에 시각적으로 표시
 */

import { MSG } from './messages.js';

export class Events {
  constructor(game) {
    this.game = game;
    this.eventCount = 0;
    this.maxEvents = 4;
    this.activeEvents = new Map();
    this.leakRoom = null;
    this.glitchActive = false;
    this.glitchNextCommand = false;

    this.eventTypes = {
      blackout: {
        id: 'blackout', name: '정전', nameEn: 'BLACKOUT', icon: '⚡', type: 'error',
        probability: 0.06, duration: 5,
        onTrigger: () => this.triggerBlackout(),
        onTick: () => this.tickBlackout(),
        onEnd: () => this.endBlackout(),
      },
      o2Leak: {
        id: 'o2Leak', name: '산소 누출', nameEn: 'O2 LEAK', icon: '💨', type: 'error',
        probability: 0.05, duration: 8,
        onTrigger: () => this.triggerO2Leak(),
        onTick: () => this.tickO2Leak(),
        onEnd: () => this.endO2Leak(),
      },
      noiseSpike: {
        id: 'noiseSpike', name: '추적 강화', nameEn: 'TRACKING', icon: '📡', type: 'warning',
        probability: 0.04, duration: 6,
        condition: () => this.game.state.resources.noise >= 40,
        onTrigger: () => this.triggerNoiseSpike(),
        onTick: () => this.tickNoiseSpike(),
        onEnd: () => this.endNoiseSpike(),
      },
      systemGlitch: {
        id: 'systemGlitch', name: '시스템 불안정', nameEn: 'UNSTABLE', icon: '🔧', type: 'warning',
        probability: 0.04, duration: 4,
        onTrigger: () => this.triggerSystemGlitch(),
        onTick: () => {},
        onEnd: () => this.endSystemGlitch(),
      },
      powerSurge: {
        id: 'powerSurge', name: '전력 급증', nameEn: 'SURGE', icon: '⚡', type: 'info',
        probability: 0.05, duration: 1,
        onTrigger: () => this.triggerPowerSurge(),
        onTick: () => {},
        onEnd: () => {},
      },
    };
  }

  isTutorialRun() {
    return this.game?.tutorial && !this.game.tutorial.isCompleted();
  }

  tick() {
    for (const [id, event] of this.activeEvents) {
      event.remaining--;
      event.onTick();
      if (event.remaining <= 0) {
        event.onEnd();
        this.activeEvents.delete(id);
        this.game.leftPanel?.flash('success');
      }
    }
    if (!this.isTutorialRun() && this.eventCount < this.maxEvents && this.game.state.time >= 30) {
      this.checkNewEvent();
    }
    this.updateLeftPanel();
  }

  updateLeftPanel() {
    const events = Array.from(this.activeEvents.values()).map(e => ({
      id: e.id, name: e.name, nameEn: e.nameEn, icon: e.icon, type: e.type,
      remaining: e.remaining, maxDuration: e.duration,
      detail: this.getEventDetail(e),
    }));
    this.game.leftPanel?.updateEffects(events);
  }

  getEventDetail(event) {
    switch (event.id) {
      case 'blackout': return 'scan 비활성화';
      case 'o2Leak': return this.leakRoom ? `${MSG.ROOMS[this.leakRoom]}` : '';
      case 'noiseSpike': return '적 이동 2배속';
      case 'systemGlitch': return '명령 실패 가능';
      default: return '';
    }
  }

  checkNewEvent() {
    for (const eventType of Object.values(this.eventTypes)) {
      if (this.activeEvents.has(eventType.id)) continue;
      if (eventType.condition && !eventType.condition()) continue;
      if (Math.random() < eventType.probability) {
        this.triggerEvent(eventType);
        break;
      }
    }
  }

  triggerEvent(eventType) {
    this.eventCount++;
    this.activeEvents.set(eventType.id, { ...eventType, remaining: eventType.duration });
    this.game.crt?.glitch(300);
    this.game.leftPanel?.flash(eventType.type);
    this.game.leftPanel?.logEvent(`${eventType.icon} ${eventType.name} 발생!`, eventType.type);
    eventType.onTrigger();
  }

  triggerBlackout() { this.game.state.resources.power = Math.max(0, this.game.state.resources.power - 15); }
  tickBlackout() { this.game.state.resources.power = Math.max(0, this.game.state.resources.power - 1); }
  endBlackout() { this.game.leftPanel?.logEvent('⚡ 전력 복구', 'success'); }
  isBlackout() { return this.activeEvents.has('blackout'); }

  triggerO2Leak() { this.leakRoom = this.game.state.location; }
  tickO2Leak() { if (this.game.state.location === this.leakRoom) this.game.state.resources.o2 = Math.max(0, this.game.state.resources.o2 - 2); }
  endO2Leak() { this.game.leftPanel?.logEvent('💨 누출 봉쇄', 'success'); this.leakRoom = null; }
  getLeakRoom() { return this.activeEvents.has('o2Leak') ? this.leakRoom : null; }

  triggerNoiseSpike() { this.game.state.enemy.distance = Math.max(0, this.game.state.enemy.distance - 1); }
  tickNoiseSpike() { if (this.game.state.time % 2 === 0) this.game.state.enemy.distance = Math.max(0, this.game.state.enemy.distance - 1); }
  endNoiseSpike() { this.game.leftPanel?.logEvent('📡 추적 정상화', 'success'); }

  triggerSystemGlitch() { this.glitchActive = true; this.glitchNextCommand = true; }
  endSystemGlitch() { this.glitchActive = false; this.glitchNextCommand = false; this.game.leftPanel?.logEvent('🔧 시스템 안정화', 'success'); }
  checkGlitchFail() {
    if (this.glitchActive && this.glitchNextCommand) {
      this.glitchNextCommand = false;
      if (Math.random() < 0.3) { this.game.leftPanel?.logEvent('🔧 명령 실패!', 'error'); this.game.triggerError(); return true; }
    }
    return false;
  }

  triggerPowerSurge() {
    if (Math.random() < 0.5) {
      const bonus = 10 + Math.floor(Math.random() * 10);
      this.game.state.resources.power = Math.min(100, this.game.state.resources.power + bonus);
      this.game.leftPanel?.logEvent(`⚡ 전력 +${bonus}`, 'success');
    } else {
      const damage = 5 + Math.floor(Math.random() * 10);
      this.game.state.resources.power = Math.max(0, this.game.state.resources.power - damage);
      this.game.state.resources.noise = Math.min(100, this.game.state.resources.noise + 10);
      this.game.leftPanel?.logEvent(`⚡ 과부하 -${damage}`, 'error');
    }
  }

  getActiveEvents() { return Array.from(this.activeEvents.values()).map(e => ({ name: e.name, remaining: e.remaining })); }
  showStatus() {}
}
