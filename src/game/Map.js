/**
 * Map - 맵 시스템
 * 방 연결 그래프 + 이동 제약 + 잠긴 구역
 */

import { MSG } from './messages.js';

export class GameMap {
  constructor(game) {
    this.game = game;
    
    // 기본 맵 연결 (그래프)
    this.baseConnections = {
      hub: ['reactor', 'medbay', 'storage'],
      reactor: ['hub'],
      medbay: ['hub'],
      storage: ['hub', 'security'],
      security: ['storage', 'airlock'],
      airlock: ['security'],
    };
    
    // 현재 런의 맵 연결 (변주 적용)
    this.connections = {};
    
    // 잠긴 방 (런 시작 시 랜덤 설정)
    this.lockedRooms = new Set();
    
    // 단축 경로 활성화 여부
    this.hasShortcut = false;
    
    // 초기화
    this.initializeMap();
  }
  
  /**
   * 맵 초기화 (런 시작 시)
   */
  initializeMap() {
    // 기본 연결 복사
    this.connections = {};
    for (const [room, conns] of Object.entries(this.baseConnections)) {
      this.connections[room] = [...conns];
    }
    
    // 단축 경로 확률 (메타 해금 시 +20%)
    let shortcutChance = 0.1; // 기본 10%
    if (this.game.meta?.saved?.unlocks?.shortcut_chance) {
      shortcutChance += 0.2;
    }
    
    if (Math.random() < shortcutChance) {
      this.hasShortcut = true;
      // hub ↔ airlock 직통 추가
      this.connections.hub.push('airlock');
      this.connections.airlock.push('hub');
    }
    
    // 잠긴 방 설정 (1~2개, hub/airlock 제외)
    this.lockedRooms.clear();
    const lockableRooms = ['reactor', 'medbay', 'storage', 'security'];
    const numLocked = Math.random() < 0.3 ? 2 : (Math.random() < 0.5 ? 1 : 0);
    
    const shuffled = [...lockableRooms].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numLocked; i++) {
      this.lockedRooms.add(shuffled[i]);
    }
  }
  
  /**
   * 이동 가능 여부 확인
   * @param {string} from - 출발 방
   * @param {string} to - 도착 방
   * @returns {{ canMove: boolean, reason?: string }}
   */
  canMove(from, to) {
    // 연결 확인
    const connected = this.connections[from];
    if (!connected || !connected.includes(to)) {
      const toKr = MSG.ROOMS[to] || to;
      return { 
        canMove: false, 
        reason: MSG.MOVE_NOT_CONNECTED(to, toKr)
      };
    }
    
    // 잠긴 방 확인
    if (this.lockedRooms.has(to)) {
      // Engineer 키카드 체크
      if (this.game.state.hasEngineerKeycard) {
        return { canMove: true, useKeycard: true };
      }
      
      // Engineer 이상 권한이면 unlock 가능 (하지만 이동은 별도)
      const toKr = MSG.ROOMS[to] || to;
      return { 
        canMove: false, 
        reason: MSG.MOVE_LOCKED(to, toKr),
        locked: true
      };
    }
    
    return { canMove: true };
  }
  
  /**
   * 방 잠금 해제
   * @param {string} room - 해제할 방
   * @returns {boolean} 성공 여부
   */
  unlockRoom(room) {
    if (!this.lockedRooms.has(room)) {
      return false;
    }
    
    // 권한 체크 (engineer 이상)
    const perm = this.game.state.permission;
    if (perm === 'guest') {
      this.game.print(MSG.PERMISSION_DENIED, 'error');
      return false;
    }
    
    this.lockedRooms.delete(room);
    return true;
  }
  
  /**
   * 키카드로 잠금 해제
   */
  useKeycardOn(room) {
    if (!this.game.state.hasEngineerKeycard) {
      return false;
    }
    
    if (!this.lockedRooms.has(room)) {
      return false;
    }
    
    this.game.state.hasEngineerKeycard = false;
    this.lockedRooms.delete(room);
    return true;
  }
  
  /**
   * 현재 방에서 갈 수 있는 방 목록
   */
  getAvailableRooms(from) {
    const connected = this.connections[from] || [];
    return connected.map(room => ({
      room,
      roomKr: MSG.ROOMS[room] || room,
      locked: this.lockedRooms.has(room),
    }));
  }
  
  /**
   * 맵 상태 출력 (map 커맨드용)
   */
  showMap() {
    const current = this.game.state.location;
    const currentKr = MSG.ROOMS[current];
    
    this.game.print(MSG.MAP_HEADER, 'system');
    this.game.print('');
    
    // 맵 그리기 (잠긴 방 표시)
    const locked = (room) => this.lockedRooms.has(room) ? '🔒' : '';
    const you = (room) => room === current ? '★' : '';
    
    if (this.hasShortcut) {
      // 단축 경로 있는 맵
      this.game.print(`    [reactor]${locked('reactor')}${you('reactor')}---[hub]${you('hub')}---[medbay]${locked('medbay')}${you('medbay')}`);
      this.game.print('                  |     \\');
      this.game.print(`              [storage]${locked('storage')}${you('storage')}  \\`);
      this.game.print('                  |       \\');
      this.game.print(`             [security]${locked('security')}${you('security')}  |`);
      this.game.print('                  |       |');
      this.game.print(`             [airlock]${you('airlock')}---+`);
    } else {
      // 기본 맵
      this.game.print(`    [reactor]${locked('reactor')}${you('reactor')}---[hub]${you('hub')}---[medbay]${locked('medbay')}${you('medbay')}`);
      this.game.print('                  |');
      this.game.print(`              [storage]${locked('storage')}${you('storage')}`);
      this.game.print('                  |');
      this.game.print(`             [security]${locked('security')}${you('security')}`);
      this.game.print('                  |');
      this.game.print(`             [airlock]${you('airlock')}`);
    }
    
    this.game.print('');
    this.game.print(`현재 위치: ★ ${currentKr} (${current})`, 'success');
    
    // 연결된 방 표시
    const available = this.getAvailableRooms(current);
    this.game.print('');
    this.game.print('이동 가능:', 'system');
    available.forEach(({ room, roomKr, locked }) => {
      const lockIcon = locked ? ' 🔒' : '';
      this.game.print(`  cd ${room} - ${roomKr}${lockIcon}`);
    });
    
    // 잠긴 방 정보
    if (this.lockedRooms.size > 0) {
      this.game.print('');
      this.game.print('🔒 = 잠긴 구역 (engineer 권한으로 unlock 또는 키카드 필요)', 'warning');
    }
    
    if (this.hasShortcut) {
      this.game.print('');
      this.game.print('✨ 단축 경로 활성화: hub ↔ airlock', 'success');
    }
  }
  
  /**
   * run 커맨드 (빠른 이동, 소음 +3)
   */
  canRun(from, to) {
    // 일단 기본 이동 가능 여부 체크
    const result = this.canMove(from, to);
    if (!result.canMove) return result;
    
    // run은 추가 소음
    return { canMove: true, extraNoise: 3 };
  }
}
