/**
 * Meta - 메타 진행 시스템
 * DATA 재화 + 영구 해금 + 상점
 */

const STORAGE_KEY = 'deadline-shell-meta';

export class Meta {
  constructor(game) {
    this.game = game;
    
    // 해금 항목 정의
    this.unlockables = {
      engineer_start: {
        id: 'engineer_start',
        name: 'Engineer 시작',
        desc: '런 시작 시 engineer 권한으로 시작',
        cost: 80,
        unlocked: false,
      },
      temp_su_token: {
        id: 'temp_su_token',
        name: '임시 SU 토큰',
        desc: '런 시작 시 1회용 su 토큰 보유',
        cost: 40,
        unlocked: false,
        consumable: true,
      },
      engineer_keycard: {
        id: 'engineer_keycard',
        name: 'Engineer 키카드',
        desc: '런 시작 시 잠긴 문 1개 즉시 해제 가능',
        cost: 30,
        unlocked: false,
        consumable: true,
      },
      emergency_o2: {
        id: 'emergency_o2',
        name: '응급 O2 캔',
        desc: '런 시작 시 O2 +30 아이템 보유',
        cost: 25,
        unlocked: false,
        consumable: true,
      },
      early_drain_relief: {
        id: 'early_drain_relief',
        name: '초반 드레인 완화',
        desc: '첫 30초간 O2 드레인 없음',
        cost: 50,
        unlocked: false,
      },
      shortcut_chance: {
        id: 'shortcut_chance',
        name: '단축 경로 확률',
        desc: 'hub↔airlock 직통 경로 확률 +20%',
        cost: 60,
        unlocked: false,
      },
    };
    
    // 런 내 획득 DATA (아직 확정 안 됨)
    this.runData = {
      objectivesCompleted: 0,
      logsCollected: 0,
      dangerEscapes: 0,
      escaped: false,
    };
    
    // 영구 저장 데이터
    this.saved = {
      totalData: 0,
      unlocks: {},
      stats: {
        totalRuns: 0,
        totalEscapes: 0,
        totalDeaths: 0,
        fastestEscape: null,
      },
    };
    
    this.load();
  }
  
  /**
   * localStorage에서 불러오기
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.saved = { ...this.saved, ...data };
        
        // 해금 상태 복원
        for (const id of Object.keys(this.saved.unlocks)) {
          if (this.unlockables[id]) {
            this.unlockables[id].unlocked = true;
          }
        }
      }
    } catch (e) {
      console.warn('Meta load failed:', e);
    }
  }
  
  /**
   * localStorage에 저장
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
    } catch (e) {
      console.warn('Meta save failed:', e);
    }
  }
  
  /**
   * 런 시작 시 호출 - 해금 효과 적용
   */
  applyStartBonuses() {
    const bonuses = [];
    
    if (this.saved.unlocks.engineer_start) {
      this.game.state.permission = 'engineer';
      bonuses.push('Engineer 권한으로 시작');
    }
    
    if (this.saved.unlocks.early_drain_relief) {
      this.game.state.earlyDrainRelief = true;
      bonuses.push('30초간 O2 드레인 없음');
    }
    
    if (this.saved.unlocks.emergency_o2) {
      this.game.state.hasEmergencyO2 = true;
      bonuses.push('응급 O2 캔 보유');
    }
    
    if (this.saved.unlocks.temp_su_token) {
      this.game.state.hasTempSuToken = true;
      bonuses.push('임시 SU 토큰 보유');
    }
    
    if (this.saved.unlocks.engineer_keycard) {
      this.game.state.hasEngineerKeycard = true;
      bonuses.push('Engineer 키카드 보유');
    }
    
    return bonuses;
  }
  
  /**
   * 목표 완료 시 호출
   */
  onObjectiveComplete() {
    this.runData.objectivesCompleted++;
  }
  
  /**
   * 위험 탈출 시 호출 (적 거리 1에서 생존)
   */
  onDangerEscape() {
    if (this.runData.dangerEscapes < 3) {
      this.runData.dangerEscapes++;
    }
  }
  
  /**
   * 런 종료 시 DATA 계산
   * @param {boolean} escaped - 탈출 성공 여부
   * @param {number} time - 클리어 시간 (초)
   */
  calculateRunReward(escaped, time) {
    let data = 0;
    const breakdown = [];
    
    // 목표당 +15
    const objData = this.runData.objectivesCompleted * 15;
    if (objData > 0) {
      data += objData;
      breakdown.push(`목표 완료 (${this.runData.objectivesCompleted}개): +${objData}`);
    }
    
    // 탈출 성공 보너스 +30
    if (escaped) {
      data += 30;
      breakdown.push('탈출 성공: +30');
      this.saved.stats.totalEscapes++;
      
      // 최단 시간 갱신
      if (!this.saved.stats.fastestEscape || time < this.saved.stats.fastestEscape) {
        this.saved.stats.fastestEscape = time;
        breakdown.push('★ 최단 시간 갱신!');
      }
    } else {
      this.saved.stats.totalDeaths++;
    }
    
    // 위험 탈출 보너스 (최대 3회, 회당 +5)
    const dangerData = this.runData.dangerEscapes * 5;
    if (dangerData > 0) {
      data += dangerData;
      breakdown.push(`위험 탈출 (${this.runData.dangerEscapes}회): +${dangerData}`);
    }
    
    // 실패 시 50%만 유지
    if (!escaped) {
      const penalty = Math.floor(data * 0.5);
      data = data - penalty;
      if (penalty > 0) {
        breakdown.push(`사망 패널티 (-50%): -${penalty}`);
      }
    }
    
    this.saved.stats.totalRuns++;
    this.saved.totalData += data;
    this.save();
    
    return { data, breakdown, total: this.saved.totalData };
  }
  
  /**
   * 상점 UI 출력
   */
  showShop() {
    this.game.print('');
    this.game.print('=== 상점 ===', 'system');
    this.game.print(`보유 DATA: ${this.saved.totalData}`, 'success');
    this.game.print('');
    
    let index = 1;
    for (const item of Object.values(this.unlockables)) {
      const status = item.unlocked ? '[해금됨]' : `[${item.cost} DATA]`;
      const prefix = item.unlocked ? '✓' : `${index}.`;
      this.game.print(`${prefix} ${item.name} ${status}`);
      this.game.print(`   ${item.desc}`, 'system');
      index++;
    }
    
    this.game.print('');
    this.game.print('구매: buy <번호>', 'system');
  }
  
  /**
   * 아이템 구매
   */
  buyItem(index) {
    const items = Object.values(this.unlockables);
    const item = items[index - 1];
    
    if (!item) {
      this.game.print('잘못된 번호입니다.', 'error');
      return false;
    }
    
    if (item.unlocked) {
      this.game.print('이미 해금된 항목입니다.', 'warning');
      return false;
    }
    
    if (this.saved.totalData < item.cost) {
      this.game.print(`DATA가 부족합니다. (필요: ${item.cost}, 보유: ${this.saved.totalData})`, 'error');
      return false;
    }
    
    // 구매 처리
    this.saved.totalData -= item.cost;
    this.saved.unlocks[item.id] = true;
    item.unlocked = true;
    this.save();
    
    this.game.print(`★ ${item.name} 해금! ★`, 'success');
    this.game.print(`남은 DATA: ${this.saved.totalData}`, 'system');
    
    return true;
  }
  
  /**
   * 통계 출력
   */
  showStats() {
    const s = this.saved.stats;
    this.game.print('');
    this.game.print('=== 통계 ===', 'system');
    this.game.print(`총 DATA: ${this.saved.totalData}`);
    this.game.print(`총 런: ${s.totalRuns}`);
    this.game.print(`탈출 성공: ${s.totalEscapes}`);
    this.game.print(`사망: ${s.totalDeaths}`);
    if (s.fastestEscape) {
      const mins = Math.floor(s.fastestEscape / 60);
      const secs = s.fastestEscape % 60;
      this.game.print(`최단 탈출: ${mins}분 ${secs}초`);
    }
    this.game.print('');
  }
  
  /**
   * 런 데이터 초기화 (새 런 시작 시)
   */
  resetRunData() {
    this.runData = {
      objectivesCompleted: 0,
      logsCollected: 0,
      dangerEscapes: 0,
      escaped: false,
    };
  }
  
  /**
   * 모든 데이터 초기화 (디버그용)
   */
  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this.saved = {
      totalData: 0,
      unlocks: {},
      stats: {
        totalRuns: 0,
        totalEscapes: 0,
        totalDeaths: 0,
        fastestEscape: null,
      },
    };
    for (const item of Object.values(this.unlockables)) {
      item.unlocked = false;
    }
  }
}
