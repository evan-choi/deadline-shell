/**
 * Move Commands - cd, run, hide
 */

import { MSG } from '../messages.js';

export function cmdCd(game, room) {
  if (!room) {
    game.print(MSG.MOVE_USAGE, 'error');
    return false;
  }

  const result = game.map.canMove(game.state.location, room);

  if (!result.canMove) {
    game.print(result.reason, 'error');
    if (result.locked) {
      game.leftPanel.logEvent(`🔒 ${MSG.ROOMS[room]} 잠김: unlock ${room} 필요`, 'warning');
    }
    game.triggerError();
    return false;
  }

  if (result.useKeycard) {
    game.map.useKeycardOn(room);
    game.leftPanel.logEvent('Engineer 키카드로 잠금 해제!', 'success');
  }

  game.state.location = room;
  game.state.resources.noise = Math.min(100, game.state.resources.noise + 1);

  const roomKr = MSG.ROOMS[room] || room;
  game.print(MSG.MOVE_SUCCESS(room, roomKr), 'success');

  const obj = game.objectives.getObjectiveForRoom(room);
  if (obj) {
    game.leftPanel.logEvent(`목표 가능: ${obj.name}`, 'info');
  }

  if (game.events.getLeakRoom() === room) {
    game.leftPanel.logEvent('💨 경고: 이 방에서 산소가 누출되고 있습니다!', 'error');
  }

  return true;
}

export function cmdRun(game, room) {
  if (!room) {
    game.print('사용법: run <장소>', 'error');
    return false;
  }

  const result = game.map.canMove(game.state.location, room);
  if (!result.canMove) {
    game.print(result.reason, 'error');
    game.triggerError();
    return false;
  }

  game.state.resources.noise = Math.min(100, game.state.resources.noise + 3);
  game.state.location = room;

  const roomKr = MSG.ROOMS[room] || room;
  game.print(`${roomKr}(으)로 뛰어갑니다! (소음 +3)`, 'success');

  if (game.events.getLeakRoom() === room) {
    game.leftPanel.logEvent('💨 경고: 이 방에서 산소가 누출되고 있습니다!', 'error');
  }

  return true;
}

export function cmdHide(game) {
  game.state.resources.noise = 0;
  game.state.enemy.distance = Math.min(5, game.state.enemy.distance + 2);
  game.print(MSG.HIDE_SUCCESS, 'success');
  game.state.time += 2;
}
