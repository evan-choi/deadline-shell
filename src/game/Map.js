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

    // 현재 런의 맵 연결
    this.connections = {};

    // 잠긴 방
    this.lockedRooms = new Set();

    // 단축 경로 여부
    this.hasShortcut = false;

    this.initializeMap();
  }

  isTutorialRun() {
    return this.game?.tutorial && !this.game.tutorial.isCompleted();
  }

  initializeMap() {
    // 기본 연결 복사
    this.connections = {};
    for (const [room, conns] of Object.entries(this.baseConnections)) {
      this.connections[room] = [...conns];
    }

    // 튜토리얼 런: 랜덤성 제거
    if (this.isTutorialRun()) {
      this.hasShortcut = false;
      this.lockedRooms.clear();
      return;
    }

    // 단축 경로 확률 (메타 해금 시 +20%)
    let shortcutChance = 0.1;
    if (this.game.meta?.saved?.unlocks?.shortcut_chance) {
      shortcutChance += 0.2;
    }

    if (Math.random() < shortcutChance) {
      this.hasShortcut = true;
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

  canMove(from, to) {
    const connected = this.connections[from];
    if (!connected || !connected.includes(to)) {
      const toKr = MSG.ROOMS[to] || to;
      return {
        canMove: false,
        reason: MSG.MOVE_NOT_CONNECTED(to, toKr),
      };
    }

    if (this.lockedRooms.has(to)) {
      if (this.game.state.hasEngineerKeycard) {
        return { canMove: true, useKeycard: true };
      }

      const toKr = MSG.ROOMS[to] || to;
      return {
        canMove: false,
        reason: MSG.MOVE_LOCKED(to, toKr),
        locked: true,
      };
    }

    return { canMove: true };
  }

  unlockRoom(room) {
    if (!this.lockedRooms.has(room)) return false;

    const perm = this.game.state.permission;
    if (perm === 'guest') {
      this.game.print(MSG.PERMISSION_DENIED, 'error');
      return false;
    }

    this.lockedRooms.delete(room);
    return true;
  }

  useKeycardOn(room) {
    if (!this.game.state.hasEngineerKeycard) return false;
    if (!this.lockedRooms.has(room)) return false;

    this.game.state.hasEngineerKeycard = false;
    this.lockedRooms.delete(room);
    return true;
  }

  getAvailableRooms(from) {
    const connected = this.connections[from] || [];
    return connected.map(room => ({
      room,
      roomKr: MSG.ROOMS[room] || room,
      locked: this.lockedRooms.has(room),
    }));
  }

  showMap() {
    const current = this.game.state.location;
    const currentKr = MSG.ROOMS[current];

    this.game.print(MSG.MAP_HEADER, 'system');
    this.game.print('');

    const locked = (room) => this.lockedRooms.has(room) ? '🔒' : '';
    const you = (room) => room === current ? '★' : '';

    if (this.hasShortcut) {
      this.game.print(`    [reactor]${locked('reactor')}${you('reactor')}---[hub]${you('hub')}---[medbay]${locked('medbay')}${you('medbay')}`);
      this.game.print('                  |     \\');
      this.game.print(`              [storage]${locked('storage')}${you('storage')}  \\`);
      this.game.print('                  |       \\');
      this.game.print(`             [security]${locked('security')}${you('security')}  |`);
      this.game.print('                  |       |');
      this.game.print(`             [airlock]${you