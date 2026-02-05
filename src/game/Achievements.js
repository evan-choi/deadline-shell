/**
 * Achievements - 업적 시스템
 * localStorage에 저장, DATA 보상
 */

const STORAGE_KEY = 'deadline-shell-achievements';

export class Achievements {
  constructor(game) {
    this.game = game;
    
    // 업적 정의
    this.list = {
      // 기본
      first_status: {
        id: 'first_status',
        name: '시스템 점검',
        desc: '처음으로 status 명령어 사용',
        reward: 5,
        unlocked: false,
        hidden: false,
      },
      first_scan: {
        id: 'first_scan',
        name: '레이더 가동',
        desc: '처음으로 scan 명령어 사용',
        reward: 5,
        unlocked: false,
        hidden: false,
      },
      first_move: {
        id: 'first_move',
        name: '첫 발걸음',
        desc: '처음으로 다른 방으로 이동',
        reward: 5,
        unlocked: false,
        hidden: false,
      },
      tutorial_complete: {
        id: 'tutorial_complete',
        name: '훈련 완료',
        desc: '튜토리얼을 완료',
        reward: 20,
        unlocked: false,
        hidden: false,
      },
      
      // 탈출
      first_escape: {
        id: 'first_escape',
        name: '생존자',
        desc: '처음으로 탈출 성공',
        reward: 50,
        unlocked: false,
        hidden: false,
      },
      speed_escape: {
        id: 'speed_escape',
        name: '스피드러너',
        desc: '5분 이내에 탈출',
        reward: 100,
        unlocked: false,
        hidden: false,
      },
      perfect_escape: {
        id: 'perfect_escape',
        name: '완벽한 탈출',
        desc: '목표 3개 모두 완료 후 탈출',
        reward: 80,
        unlocked: false,
        hidden: false,
      },
      low_o2_escape: {
        id: 'low_o2_escape',
        name: '숨 참고 탈출',
        desc: 'O2 10% 이하로 탈출',
        reward: 60,
        unlocked: false,
        hidden: false,
      },
      
      // 권한
      become_engineer: {
        id: 'become_engineer',
        name: '엔지니어',
        desc: 'engineer 권한 획득',
        reward: 10,
        unlocked: false,
        hidden: false,
      },
      become_admin: {
        id: 'become_admin',
        name: '관리자',
        desc: 'admin 권한 획득',
        reward: 30,
        unlocked: false,
        hidden: false,
      },
      
      // 생존
      danger_escape_1: {
        id: 'danger_escape_1',
        name: '아슬아슬',
        desc: '적 거리 1에서 생존',
        reward: 15,
        unlocked: false,
        hidden: false,
      },
      danger_escape_5: {
        id: 'danger_escape_5',
        name: '데스 댄서',
        desc: '적 거리 1에서 5회 생존 (누적)',
        reward: 50,
        unlocked: false,
        hidden: true,
      },
      hide_master: {
        id: 'hide_master',
        name: '은신의 달인',
        desc: 'hide 명령어 10회 사용 (누적)',
        reward: 30,
        unlocked: false,
        hidden: true,
      },
      
      // 수리
      first_repair: {
        id: 'first_repair',
        name: '수리공',
        desc: '처음으로 목표 수리 완료',
        reward: 15,
        unlocked: false,
        hidden: false,
      },
      repair_all: {
        id: 'repair_all',
        name: '만능 정비사',
        desc: '한 런에서 목표 3개 모두 수리',
        reward: 40,
        unlocked: false,
        hidden: false,
      },
      
      // 이벤트
      survive_blackout: {
        id: 'survive_blackout',
        name: '암흑 속에서',
        desc: '정전 이벤트 발생 후 탈출',
        reward: 20,
        unlocked: false,
        hidden: true,
      },
      survive_o2leak: {
        id: 'survive_o2leak',
        name: '호흡 조절',
        desc: '산소 누출 이벤트 발생 후 탈출',
        reward: 20,
        unlocked: false,
        hidden: true,
      },
      
      // 메타
      first_purchase: {
        id: 'first_purchase',
        name: '쇼핑 시작',
        desc: '상점에서 첫 구매',
        reward: 10,
        unlocked: false,
        hidden: false,
      },
      data_collector: {
        id: 'data_collector',
        name: '데이터 수집가',
        desc: '총 500 DATA 획득',
        reward: 100,
        unlocked: false,
        hidden: false,
      },
      
      // 런 횟수
      runs_10: {
        id: 'runs_10',
        name: '집념',
        desc: '10회 플레이',
        reward: 30,
        unlocked: false,
        hidden: false,
      },
      runs_50: {
        id: 'runs_50',
        name: '베테랑',
        desc: '50회 플레이',
        reward: 100,
        unlocked: false,
        hidden: true,
      },
      
      // 사망
      first_death: {
        id: 'first_death',
        name: '시작이 반',
        desc: '처음으로 사망',
        reward: 5,
        unlocked: false,
        hidden: false,
      },
      death_by_o2: {
        id: 'death_by_o2',
        name: '질식',
        desc: '산소 부족으로 사망',
        reward: 5,
        unlocked: false,
        hidden: true,
      },
      death_by_enemy: {
        id: 'death_by_enemy',
        name: '추적당함',
        desc: '적에게 발각되어 사망',
        reward: 5,
        unlocked: false,
        hidden: true,
      },
    };
    
    // 누적 카운터 (업적 조건용)
    this.counters = {
      dangerEscapes: 0,
      hideUsed: 0,
      totalRuns: 0,
      totalData: 0,
    };
    
    // 이번 런 플래그
    this.runFlags = {
      hadBlackout: false,
      hadO2Leak: false,
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
        
        // 해금 상태 복원
        if (data.unlocked) {
          for (const id of data.unlocked) {
            if (this.list[id]) {
              this.list[id].unlocked = true;
            }
          }
        }
        
        // 카운터 복원
        if (data.counters) {
          this.counters = { ...this.counters, ...data.counters };
        }
      }
    } catch (e) {
      console.warn('Achievements load failed:', e);
    }
  }
  
  /**
   * localStorage에 저장
   */
  save() {
    try {
      const unlocked = Object.values(this.list)
        .filter(a => a.unlocked)
        .map(a => a.id);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        unlocked,
        counters: this.counters,
      }));
    } catch (e) {
      console.warn('Achievements save failed:', e);
    }
  }
  
  /**
   * 업적 해금
   * @returns {number} 보상 DATA (이미 해금된 경우 0)
   */
  unlock(achievementId) {
    const achievement = this.list[achievementId];
    if (!achievement || achievement.unlocked) return 0;
    
    achievement.unlocked = true;
    this.save();
    
    // 알림 출력
    this.game.print('');
    this.game.print('🏆 업적 달성!', 'success');
    this.game.print(`   ${achievement.name}`, 'success');
    this.game.print(`   "${achievement.desc}"`, 'system');
    this.game.print(`   +${achievement.reward} DATA`, 'warning');
    this.game.print('');
    
    // META에 DATA 추가
    if (this.game.meta) {
      this.game.meta.saved.totalData += achievement.reward;
      this.game.meta.save();
    }
    
    return achievement.reward;
  }
  
  /**
   * 조건 체크 후 자동 해금
   */
  check(eventType, data = {}) {
    switch (eventType) {
      case 'command':
        this.checkCommand(data.cmd);
        break;
      case 'escape':
        this.checkEscape(data);
        break;
      case 'death':
        this.checkDeath(data);
        break;
      case 'permission':
        this.checkPermission(data.level);
        break;
      case 'repair':
        this.checkRepair(data);
        break;
      case 'event':
        this.checkEvent(data.type);
        break;
      case 'purchase':
        this.unlock('first_purchase');
        break;
      case 'tutorial_complete':
        this.unlock('tutorial_complete');
        break;
      case 'danger_escape':
        this.counters.dangerEscapes++;
        this.save();
        this.unlock('danger_escape_1');
        if (this.counters.dangerEscapes >= 5) {
          this.unlock('danger_escape_5');
        }
        break;
    }
  }
  
  checkCommand(cmd) {
    if (cmd === 'status') this.unlock('first_status');
    if (cmd === 'scan') this.unlock('first_scan');
    if (cmd.startsWith('cd ')) this.unlock('first_move');
    if (cmd === 'hide') {
      this.counters.hideUsed++;
      this.save();
      if (this.counters.hideUsed >= 10) {
        this.unlock('hide_master');
      }
    }
  }
  
  checkEscape(data) {
    this.unlock('first_escape');
    
    if (data.time <= 300) { // 5분
      this.unlock('speed_escape');
    }
    
    if (data.objectives >= 3) {
      this.unlock('perfect_escape');
    }
    
    if (data.o2 <= 10) {
      this.unlock('low_o2_escape');
    }
    
    if (this.runFlags.hadBlackout) {
      this.unlock('survive_blackout');
    }
    
    if (this.runFlags.hadO2Leak) {
      this.unlock('survive_o2leak');
    }
  }
  
  checkDeath(data) {
    this.unlock('first_death');
    
    if (data.cause === 'o2') {
      this.unlock('death_by_o2');
    } else if (data.cause === 'enemy') {
      this.unlock('death_by_enemy');
    }
  }
  
  checkPermission(level) {
    if (level === 'engineer') this.unlock('become_engineer');
    if (level === 'admin') this.unlock('become_admin');
  }
  
  checkRepair(data) {
    this.unlock('first_repair');
    
    if (data.total >= 3) {
      this.unlock('repair_all');
    }
  }
  
  checkEvent(type) {
    if (type === 'blackout') this.runFlags.hadBlackout = true;
    if (type === 'o2leak') this.runFlags.hadO2Leak = true;
  }
  
  /**
   * 런 시작 시 플래그 초기화
   */
  resetRunFlags() {
    this.runFlags = {
      hadBlackout: false,
      hadO2Leak: false,
    };
  }
  
  /**
   * 런 횟수 체크
   */
  checkRuns(totalRuns) {
    this.counters.totalRuns = totalRuns;
    this.save();
    
    if (totalRuns >= 10) this.unlock('runs_10');
    if (totalRuns >= 50) this.unlock('runs_50');
  }
  
  /**
   * 총 DATA 체크
   */
  checkTotalData(total) {
    this.counters.totalData = total;
    this.save();
    
    if (total >= 500) this.unlock('data_collector');
  }
  
  /**
   * 업적 목록 출력
   */
  showList() {
    this.game.print('');
    this.game.print('=== 업적 ===', 'system');
    
    const unlocked = Object.values(this.list).filter(a => a.unlocked);
    const locked = Object.values(this.list).filter(a => !a.unlocked && !a.hidden);
    const hidden = Object.values(this.list).filter(a => !a.unlocked && a.hidden);
    
    this.game.print(`달성: ${unlocked.length}/${Object.keys(this.list).length}`, 'system');
    this.game.print('');
    
    if (unlocked.length > 0) {
      this.game.print('[달성한 업적]', 'success');
      unlocked.forEach(a => {
        this.game.print(`  🏆 ${a.name} - ${a.desc}`);
      });
      this.game.print('');
    }
    
    if (locked.length > 0) {
      this.game.print('[미달성 업적]', 'warning');
      locked.forEach(a => {
        this.game.print(`  ○ ${a.name} - ${a.desc} (+${a.reward} DATA)`);
      });
      this.game.print('');
    }
    
    if (hidden.length > 0) {
      this.game.print(`[숨겨진 업적: ${hidden.length}개]`, 'system');
    }
    
    this.game.print('');
  }
  
  /**
   * 전체 초기화 (디버그용)
   */
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    for (const a of Object.values(this.list)) {
      a.unlocked = false;
    }
    this.counters = {
      dangerEscapes: 0,
      hideUsed: 0,
      totalRuns: 0,
      totalData: 0,
    };
  }
}
