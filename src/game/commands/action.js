/**
 * Action Commands - repair, login, su, lock, unlock, escape
 */

import { MSG } from '../messages.js';

export function cmdRepair(game) {
  const { location, permission, resources } = game.state;
  const obj = game.objectives.getObjectiveForRoom(location);

  if (!obj) {
    game.print(MSG.REPAIR_NOTHING, 'warning');
    return false;
  }

  if (obj.completed) {
    game.print(MSG.REPAIR_ALREADY_DONE, 'warning');
    return false;
  }

  // 권한 체크
  if (obj.requiresPermission && permission !== 'admin') {
    game.print(MSG.REPAIR_NEED_PERMISSION, 'error');
    game.triggerError();
    return false;
  }

  // 전력 체크
  if (resources.power < 10) {
    game.print(MSG.REPAIR_NO_POWER, 'error');
    game.triggerError();
    return false;
  }

  // 타이핑 챌린지 시작
  game.typingChallenge.start(obj.id, () => {
    // 성공 콜백
    resources.power -= 10;
    game.objectives.complete(obj.id);
    game.leftPanel.logEvent(`✓ 수리 완료: ${obj.name}`, 'success');

    // 업적 체크
    game.achievements.check('repair');

    // 탈출 가능 체크
    if (game.objectives.canEscape()) {
      game.print('', 'system');
      game.print(MSG.ESCAPE_READY, 'success');
      game.leftPanel.logEvent('🚀 탈출 가능! airlock으로 이동 후 escape 입력', 'success');
    }
  });

  return true;
}

export function cmdLogin(game, level) {
  if (!level) {
    game.print('사용법: login <레벨>', 'error');
    game.print('예: login user, login admin', 'system');
    return false;
  }

  const validLevels = ['guest', 'user', 'admin'];
  if (!validLevels.includes(level)) {
    game.print(`유효하지 않은 권한 레벨: ${level}`, 'error');
    game.triggerError();
    return false;
  }

  if (level === 'admin') {
    game.print(MSG.LOGIN_ADMIN_DENIED, 'error');
    game.print('힌트: su 명령으로 관리자 권한 획득 가능', 'system');
    game.triggerError();
    return false;
  }

  game.state.permission = level;
  const permKr = MSG.PERMISSION[level] || level;
  game.print(`권한 변경: ${permKr}`, 'success');

  return true;
}

export function cmdSu(game) {
  const { location, permission } = game.state;

  if (permission === 'admin') {
    game.print(MSG.SU_ALREADY_ADMIN, 'warning');
    return false;
  }

  // 임시 토큰 사용
  if (game.state.hasTempSuToken) {
    game.state.hasTempSuToken = false;
    game.state.permission = 'admin';
    game.leftPanel.logEvent('🔑 임시 SU 토큰 사용!', 'success');
    game.print(MSG.SU_SUCCESS, 'success');
    game.achievements.check('su');
    return true;
  }

  // security 방에서만 가능
  if (location !== 'security') {
    game.print(MSG.SU_WRONG_LOCATION, 'error');
    game.triggerError();
    return false;
  }

  // 타이핑 챌린지
  game.typingChallenge.start('su', () => {
    game.state.permission = 'admin';
    game.print(MSG.SU_SUCCESS, 'success');
    game.leftPanel.logEvent('🔓 관리자 권한 획득!', 'success');
    game.achievements.check('su');
  });

  return true;
}

export function cmdLockDoor(game) {
  const { resources, doorLocked } = game.state;

  if (doorLocked) {
    game.print(MSG.DOOR_ALREADY_LOCKED, 'warning');
    return;
  }

  if (resources.power < 5) {
    game.print(MSG.DOOR_NO_POWER, 'error');
    return;
  }

  resources.power -= 5;
  game.state.doorLocked = true;

  game.leftPanel.logEvent('🚪 문 잠금 (전력 -5)', 'info');
  game.print(MSG.DOOR_LOCKED, 'success');
}

export function cmdUnlockDoor(game) {
  if (!game.state.doorLocked) {
    game.print(MSG.DOOR_ALREADY_UNLOCKED, 'warning');
    return;
  }

  game.state.doorLocked = false;
  game.leftPanel.logEvent('🚪 문 잠금 해제', 'info');
  game.print(MSG.DOOR_UNLOCKED, 'success');
}

export function cmdUnlockRoom(game, room) {
  if (!game.map.lockedRooms.has(room)) {
    game.print(`${room}은(는) 잠겨있지 않습니다.`, 'warning');
    return false;
  }

  if (game.map.unlockRoom(room)) {
    const roomKr = MSG.ROOMS[room] || room;
    game.leftPanel.logEvent(`🔓 잠금 해제: ${roomKr}`, 'success');
    game.print(`${roomKr} 잠금 해제!`, 'success');
    return true;
  }
  return false;
}

export function cmdEscape(game) {
  const { location, permission } = game.state;

  if (location !== 'airlock') {
    game.print(MSG.ESCAPE_WRONG_LOCATION, 'error');
    game.triggerError();
    return false;
  }

  if (!game.objectives.canEscape()) {
    game.print(MSG.ESCAPE_NOT_READY, 'error');
    game.print(`목표 진행: ${game.objectives.getCompletedCount()}/2`, 'system');
    game.triggerError();
    return false;
  }

  if (permission !== 'admin') {
    game.print(MSG.ESCAPE_NEED_ADMIN, 'error');
    game.triggerError();
    return false;
  }

  // 탈출 성공!
  game.victory();
  return true;
}
