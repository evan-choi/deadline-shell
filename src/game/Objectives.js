/**
 * Objectives - 탈출 목표 시스템
 * 3개 중 2개 완료 시 탈출 가능
 */

import { MSG } from './messages.js';

export class Objectives {
  constructor(game) {
    this.game = game;
    
    // 3가지 목표
    this.objectives = {
      reactor: {
        id: 'reactor',
        name: '원자로 수리',
        nameEn: 'Reactor Repair',
        completed: false,
        room: 'reactor',
        requiredPermission: 'engineer',
      },
      security: {
        id: 'security',
        name: '보안 시스템 해제',
        nameEn: 'Security Override',
        completed: false,
        room: 'security',
        requiredPermission: 'engineer',
      },
      airlock: {
        id: 'airlock',
        name: '에어락 준비',
        nameEn: 'Airlock Preparation',
        completed: false,
        room: 'airlock',
        requiredPermission: 'guest', // 누구나 가능
      },
    };
    
    this.requiredCount = 2;
  }
  
  /**
   * 목표 완료 처리
   * @returns {boolean} 성공 여부
   */
  complete(objectiveId) {
    const obj = this.objectives[objectiveId];
    if (!obj) return false;
    
    if (obj.completed) {
      this.game.print(`이미 완료된 목표입니다: ${obj.name}`, 'warning');
      return false;
    }
    
    // 위치 체크
    if (this.game.state.location !== obj.room) {
      this.game.print(`${obj.name}은(는) ${MSG.ROOMS[obj.room]}에서만 가능합니다.`, 'error');
      return false;
    }
    
    // 권한 체크
    if (!this.hasPermission(obj.requiredPermission)) {
      this.game.print(MSG.PERMISSION_DENIED, 'error');
      return false;
    }
    
    obj.completed = true;
    return true;
  }
  
  /**
   * 권한 확인
   */
  hasPermission(required) {
    const levels = { guest: 0, engineer: 1, admin: 2 };
    const current = levels[this.game.state.permission] || 0;
    const need = levels[required] || 0;
    return current >= need;
  }
  
  /**
   * 완료된 목표 수
   */
  getCompletedCount() {
    return Object.values(this.objectives).filter(o => o.completed).length;
  }
  
  /**
   * 탈출 가능 여부
   */
  canEscape() {
    return this.getCompletedCount() >= this.requiredCount && 
           this.game.state.location === 'airlock';
  }
  
  /**
   * 목표 현황 출력
   */
  showStatus() {
    this.game.print(MSG.OBJECTIVE_HEADER, 'system');
    this.game.print('');
    
    for (const obj of Object.values(this.objectives)) {
      if (obj.completed) {
        this.game.print(`[✓] ${obj.name}`, 'success');
      } else {
        const roomKr = MSG.ROOMS[obj.room];
        this.game.print(`[ ] ${obj.name} (${roomKr}에서 수행)`);
      }
    }
    
    this.game.print('');
    this.game.print(`진행: ${this.getCompletedCount()}/${this.requiredCount} 완료`, 'system');
    this.game.print(MSG.OBJECTIVE_HINT, 'system');
  }
  
  /**
   * 특정 방에서 가능한 목표 반환
   */
  getObjectiveForRoom(room) {
    return Object.values(this.objectives).find(
      o => o.room === room && !o.completed
    );
  }
}
