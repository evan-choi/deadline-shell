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
    objectives: '탈출 목표를 확인합니다',
    hide: '숨습니다 (적 거리 +2, 소음 초기화)',
    repair: '목표를 수리합니다 (engineer 권한 필요)',
    login: '권한을 획득합니다 (예: login engineer)',
    su: '관리자 권한으로 전환합니다',
    'lock door': '문을 잠급니다 (전력 -5)',
    'unlock door': '문을 엽니다',
    escape: '탈출합니다 (에어락에서, 목표 2개 이상 완료 시)',
    shop: '상점을 열어 해금 아이템을 구매합니다',
    stats: '누적 통계를 확인합니다',
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
  
  // 수리/목표
  REPAIR_START: '수리를 시작합니다...',
  REPAIR_SUCCESS: (system) => `${system} 수리 완료!`,
  REPAIR_FAIL: '수리할 대상이 없습니다',
  REPAIR_USAGE: '사용법: repair',
  REPAIR_NO_OBJECTIVE: '이 방에서 수리할 목표가 없습니다.',
  REPAIR_ALREADY_DONE: '이미 완료된 목표입니다.',
  REPAIR_WRONG_ROOM: (room) => `이 목표는 ${room}에서만 수행할 수 있습니다.`,
  
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
  
  // 로그인/권한
  LOGIN_SUCCESS: (level) => `권한 획득: ${level}`,
  LOGIN_FAIL: '로그인 실패. 올바른 권한을 입력하세요.',
  LOGIN_USAGE: '사용법: login <engineer>',
  LOGIN_ALREADY: (level) => `이미 ${level} 권한입니다.`,
  LOGIN_NEED_SECURITY: 'engineer 권한은 보안실(security)에서만 획득할 수 있습니다.',
  
  SU_SUCCESS: '관리자 권한을 획득했습니다!',
  SU_FAIL: 'su 실패. 타이핑 챌린지를 완료하세요.',
  SU_NEED_ENGINEER: 'su는 engineer 권한이 필요합니다.',
  SU_NEED_SECURITY: 'su는 보안실(security)에서만 가능합니다.',
  SU_ALREADY: '이미 관리자 권한입니다.',
  
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
    NEED_ENGINEER: '[TIP] repair 를 하려면 engineer 권한이 필요합니다. security 에서 login engineer 를 시도해보세요.',
    OBJECTIVE: '[TIP] objectives 를 입력하면 탈출 목표를 확인할 수 있습니다.',
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
  OBJECTIVE_COMPLETE: (name) => `★ 목표 완료: ${name} ★`,
  
  // 탈출
  ESCAPE_SUCCESS: '========== 탈출 성공! ==========',
  ESCAPE_VICTORY: '당신은 우주정거장을 탈출했습니다!',
  ESCAPE_FAIL_LOCATION: '탈출은 에어락(airlock)에서만 가능합니다.',
  ESCAPE_FAIL_OBJECTIVES: (current, required) => 
    `탈출하려면 목표를 ${required}개 이상 완료해야 합니다. (현재: ${current}개)`,
  
  // 타이핑 챌린지
  TYPING_HEADER: '=== 타이핑 챌린지 ===',
  TYPING_INSTRUCTION: '아래 명령어를 정확히 입력하세요:',
  TYPING_TIME_LIMIT: (sec) => `제한 시간: ${sec}초`,
  TYPING_SUCCESS: (sec) => `✓ 완료! (${sec}초)`,
  TYPING_FAIL_TIMEOUT: '✗ 시간 초과!',
  TYPING_FAIL_WRONG: '오타! 소음이 증가합니다. 다시 입력하세요.',
  
  // 상점
  SHOP_HEADER: '=== 상점 ===',
  SHOP_DATA: (amount) => `보유 DATA: ${amount}`,
  SHOP_BUY_USAGE: '구매: buy <번호>',
  SHOP_BUY_SUCCESS: (name) => `★ ${name} 해금! ★`,
  SHOP_BUY_FAIL_MONEY: (cost, have) => `DATA가 부족합니다. (필요: ${cost}, 보유: ${have})`,
  SHOP_BUY_FAIL_OWNED: '이미 해금된 항목입니다.',
  SHOP_BUY_FAIL_INVALID: '잘못된 번호입니다.',
  
  // 통계
  STATS_HEADER: '=== 통계 ===',
  STATS_TOTAL_DATA: (amount) => `총 DATA: ${amount}`,
  STATS_TOTAL_RUNS: (count) => `총 런: ${count}`,
  STATS_ESCAPES: (count) => `탈출 성공: ${count}`,
  STATS_DEATHS: (count) => `사망: ${count}`,
  STATS_FASTEST: (mins, secs) => `최단 탈출: ${mins}분 ${secs}초`,
  
  // 런 종료 보상
  RUN_REWARD_HEADER: '=== 런 결과 ===',
  RUN_REWARD_BREAKDOWN: 'DATA 획득 내역:',
  RUN_REWARD_TOTAL: (amount) => `획득 DATA: +${amount}`,
  RUN_REWARD_BANK: (amount) => `총 보유 DATA: ${amount}`,
  RUN_REWARD_NEW_RECORD: '★ 최단 시간 갱신!',
  
  // 시작 보너스
  START_BONUS_HEADER: '=== 시작 보너스 ===',
  START_BONUS_APPLIED: (bonuses) => bonuses.length > 0 
    ? `적용된 해금: ${bonuses.join(', ')}`
    : '적용된 해금 없음',
};
