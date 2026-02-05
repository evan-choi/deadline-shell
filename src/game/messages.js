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
    hide: '숨습니다 (적 거리 +2, 소음 초기화)',
    repair: '시스템을 수리합니다 (engineer 권한 필요)',
    'lock door': '문을 잠급니다 (전력 -5)',
    'unlock door': '문을 엽니다',
  },
  
  // 상태
  STATUS_LOCATION: '위치',
  STATUS_PERMISSION: '권한',
  STATUS_HEADER: '=== 시스템 상태 ===',
  
  // 권한
  PERMISSION: {
    guest: '손님',
    engineer: '엔지니어',
    admin: '관리자',
  },
  
  // 방 이름
  ROOMS: {
    hub: '중앙 허브',
    reactor: '원자로실',
    medbay: '의무실',
    storage: '창고',
    security: '보안실',
    airlock: '에어락',
  },
  
  // 스캔
  SCAN_START: '스캔 중...',
  SCAN_ENEMY_FAR: '적 탐지: 멀리 있음 (안전)',
  SCAN_ENEMY_APPROACHING: '적 탐지: 접근 중...',
  SCAN_ENEMY_NEAR: '⚠ 경고: 적이 가까이 있음!',
  SCAN_ENEMY_CRITICAL: '⚠⚠ 위험: 적이 매우 가까움!!',
  
  // 이동
  MOVE_SUCCESS: (room, roomKr) => `${roomKr}(으)로 이동했습니다`,
  MOVE_UNKNOWN: (room) => `알 수 없는 장소: ${room}`,
  MOVE_LOCKED: (room, roomKr) => `${roomKr}은(는) 잠겨 있습니다`,
  MOVE_USAGE: '사용법: cd <장소>',
  MOVE_NOT_CONNECTED: (room, roomKr) => `여기서 ${roomKr}(으)로 갈 수 없습니다`,
  
  // 숨기
  HIDE_SUCCESS: '조용히 숨었습니다... 적이 멀어집니다.',
  HIDE_FAIL: '숨을 곳이 없습니다!',
  
  // 수리
  REPAIR_SUCCESS: (system) => `${system} 수리 완료`,
  REPAIR_FAIL: '수리할 대상이 없습니다',
  REPAIR_USAGE: '사용법: repair <시스템>',
  
  // 문
  DOOR_LOCKED: '문을 잠갔습니다. (전력 -5)',
  DOOR_UNLOCKED: '문을 열었습니다.',
  DOOR_ALREADY_LOCKED: '이미 잠겨 있습니다.',
  DOOR_ALREADY_UNLOCKED: '이미 열려 있습니다.',
  DOOR_NO_POWER: '전력이 부족합니다!',
  
  // 맵
  MAP_HEADER: '=== 정거장 지도 ===',
  MAP_CURRENT: (room) => `현재 위치: [${room}]`,
  MAP_CONNECTIONS: '연결된 구역:',
  
  // ls
  LS_HEADER: '=== 현재 구역 ===',
  LS_ITEMS: '발견된 물건:',
  LS_NOTHING: '특별한 것이 없습니다.',
  
  // 에러
  CMD_NOT_FOUND: (cmd) => `명령어를 찾을 수 없음: ${cmd}`,
  PERMISSION_DENIED: '권한이 부족합니다 (engineer 이상 필요)',
  
  // 힌트 (10초 무입력 또는 연속 오류 시)
  HINTS: {
    START: '[TIP] status 를 입력해 현재 상태를 확인해보세요',
    AFTER_STATUS: '[TIP] scan 으로 주변 위협을 살펴보세요',
    AFTER_SCAN: '[TIP] cd <장소> 로 다른 방으로 이동할 수 있습니다 (예: cd reactor)',
    LOW_O2: '[TIP] 산소가 부족합니다! 서둘러야 합니다',
    ENEMY_NEAR: '[TIP] 적이 가깝습니다! hide 로 숨거나 빠르게 이동하세요',
    STUCK: '[TIP] help 를 입력하면 사용 가능한 명령어를 볼 수 있습니다',
  },
  
  // 게임 오버
  GAME_OVER: '========== 게임 오버 ==========',
  DEATH_O2: '산소 부족으로 질식했습니다.',
  DEATH_HP: '사망했습니다.',
  DEATH_ENEMY: '추적자에게 발각되었습니다.',
  RETRY: '다시 시도하려면 새로고침하세요.',
  
  // 목표
  OBJECTIVE_HEADER: '=== 탈출 목표 ===',
  OBJECTIVE_REACTOR: '[ ] 원자로 수리',
  OBJECTIVE_SECURITY: '[ ] 보안 시스템 해제',
  OBJECTIVE_AIRLOCK: '[ ] 에어락 준비',
  OBJECTIVE_DONE: (name) => `[✓] ${name}`,
  OBJECTIVE_HINT: '3개 중 2개를 완료하면 탈출할 수 있습니다.',
};
