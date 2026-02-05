/**
 * Core Commands - help, status, ls, objectives, scan
 */

import { MSG } from '../messages.js';

export function cmdHelp(game) {
  game.print(MSG.HELP_HEADER, 'system');
  game.print('');
  for (const [cmd, desc] of Object.entries(MSG.HELP_CMDS)) {
    game.print(`  ${cmd.padEnd(12)} - ${desc}`);
  }
}

export function cmdStatus(game) {
  const { resources, location, permission } = game.state;
  const roomKr = MSG.ROOMS[location] || location;
  const permKr = MSG.PERMISSION[permission] || permission;

  game.print(MSG.STATUS_HEADER, 'system');
  game.print(`${MSG.STATUS_LOCATION}: ${roomKr} (${location})`);
  game.print(`${MSG.STATUS_PERMISSION}: ${permKr} (${permission})`);
  game.print('');
  game.print(`HP: ${resources.hp}  O2: ${resources.o2}%`);
  game.print(`전력: ${resources.power}  소음: ${resources.noise}`);
  game.print('');
  game.print(`목표 진행: ${game.objectives.getCompletedCount()}/2`, 'system');
  game.print(`보유 DATA: ${game.meta.saved.totalData}`, 'system');
  game.print('이벤트/상태는 좌측 패널에서 확인하세요.', 'system');
}

export function cmdScan(game) {
  if (game.events.isBlackout()) {
    game.print('[오류] 정전으로 스캔이 비활성화되었습니다. (좌측 패널 참고)', 'error');
    game.triggerError();
    return false;
  }

  game.state.resources.noise = Math.min(100, game.state.resources.noise + 2);
  game.print(MSG.SCAN_START, 'system');

  const dist = game.state.enemy.distance;
  let msg, type;

  if (dist >= 5) { msg = MSG.SCAN_ENEMY_FAR; type = 'success'; }
  else if (dist >= 3) { msg = MSG.SCAN_ENEMY_APPROACHING; type = 'warning'; }
  else if (dist >= 1) { msg = MSG.SCAN_ENEMY_NEAR; type = 'error'; }
  else { msg = MSG.SCAN_ENEMY_CRITICAL; type = 'error'; }

  game.print(msg, type);
  game.print(`(거리: ${dist})`, 'system');

  const leakRoom = game.events.getLeakRoom();
  if (leakRoom) {
    game.leftPanel.logEvent(`💨 산소 누출 감지: ${MSG.ROOMS[leakRoom]}`, 'warning');
  }

  return true;
}

export function cmdLs(game) {
  const { location } = game.state;
  const roomKr = MSG.ROOMS[location] || location;

  game.print(MSG.LS_HEADER, 'system');
  game.print(`현재 위치: ${roomKr}`, 'system');
  game.print('');

  const items = {
    hub: ['터미널', '비상 지도'],
    reactor: ['원자로 제어판', '냉각 시스템', '공구함'],
    medbay: ['의료 키트', '산소 캔', '진단 장비'],
    storage: ['부품 상자', '배터리', '예비 부품'],
    security: ['보안 콘솔', '키카드 리더기', '모니터'],
    airlock: ['탈출 해치', '우주복', '비상 버튼'],
  };

  const roomItems = items[location] || [];
  if (roomItems.length > 0) {
    game.print(MSG.LS_ITEMS);
    roomItems.forEach(item => game.print(`  - ${item}`));
  } else {
    game.print(MSG.LS_NOTHING);
  }

  const obj = game.objectives.getObjectiveForRoom(location);
  if (obj) {
    game.print('');
    game.print(`[목표] ${obj.name} - repair 명령으로 수행`, 'warning');
  }
}

export function cmdObjectives(game) {
  game.objectives.showStatus();
}

export function cmdMap(game) {
  game.map.showMap();
}
