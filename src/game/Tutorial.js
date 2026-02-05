/**
 * Tutorial - 강제 단계형 튜토리얼 (확장판)
 * 탈출까지 가이드 + 부드러운 차단 메시지
 */

import { MSG } from './messages.js';

const STORAGE_KEY = 'deadline-shell-tutorial';

export class Tutorial {
  constructor(game) {
    this.game = game;
    
    // 튜토리얼 단계 정의
    this.steps = [
      {
        id: 'status',
        instruction: '현재 상태를 확인하세요.',
        command: 'status',
        hint: 'status 를 입력하세요.',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 좋습니다! HP, O2, 전력, 소음 상태를 확인했습니다.', 'success');
        },
      },
      {
        id: 'scan',
        instruction: '주변을 스캔하여 적의 위치를 파악하세요.',
        command: 'scan',
        hint: 'scan 을 입력하세요.',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 적과의 거리를 확인했습니다. (거리 0 = 사망)', 'warning');
        },
      },
      {
        id: 'map',
        instruction: '지도를 확인하여 정거장 구조를 파악하세요.',
        command: 'map',
        hint: 'map 을 입력하세요.',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 🔒 표시는 잠긴 구역입니다.', 'system');
        },
      },
      {
        id: 'move_security',
        instruction: '보안실(security)로 이동하세요. (권한 획득 필요)',
        command: 'cd security',
        hint: 'hub → storage → security 순서지만, 지금은 cd security 로 이동해봅니다.',
        // 튜토리얼 편의를 위해 바로 이동 허용 (Game.js에서 처리 필요하지만 여기선 명령만 체크)
        validate: (cmd) => cmd === 'cd security',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 보안실에 도착했습니다.', 'success');
        },
      },
      {
        id: 'login',
        instruction: 'engineer 권한을 획득하세요.',
        command: 'login engineer',
        hint: 'login engineer 를 입력하세요.',
        validate: (cmd) => cmd === 'login engineer',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] Engineer 권한 획득! 이제 수리(repair)가 가능합니다.', 'success');
        },
      },
      {
        id: 'move_reactor',
        instruction: '원자로실(reactor)로 이동하세요.',
        command: 'cd reactor',
        hint: 'cd reactor 를 입력하세요.',
        validate: (cmd) => cmd === 'cd reactor',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 원자로실에 도착했습니다.', 'success');
        },
      },
      {
        id: 'repair',
        instruction: '원자로를 수리하여 목표를 달성하세요. (타이핑 챌린지)',
        command: 'repair',
        hint: 'repair 를 입력하고, 나타나는 문구를 정확히 타이핑하세요.',
        validate: (cmd) => cmd === 'repair',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 수리 성공! 목표 1개가 완료되었습니다.', 'success');
          // 튜토리얼 특전: 목표 1개만으로 탈출 가능하게 처리 (Game.js에서 체크)
          this.game.objectives.objectives.security.completed = true; // 가짜 완료
          this.game.print('[튜토리얼] 시뮬레이션 모드: 보안 시스템이 자동 무력화되었습니다.', 'info');
          this.game.print('[튜토리얼] 이제 탈출 조건(목표 2개)이 충족되었습니다.', 'success');
        },
      },
      {
        id: 'move_airlock',
        instruction: '에어락(airlock)으로 이동하세요.',
        command: 'cd airlock',
        hint: 'cd airlock 을 입력하세요.',
        validate: (cmd) => cmd === 'cd airlock',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 에어락에 도착했습니다.', 'success');
        },
      },
      {
        id: 'escape',
        instruction: '정거장을 탈출하세요!',
        command: 'escape',
        hint: 'escape 를 입력하세요.',
        validate: (cmd) => cmd === 'escape',
        onComplete: () => {
          // victory()가 호출되므로 여기서 별도 출력 없음
        },
      },
    ];
    
    // 상태
    this.currentStep = 0;
    this.completed = false;
    this.enabled = true;
    this.lastInputTime = Date.now();
    this.hintInterval = null;
    
    this.load();
    
    // 힌트 체크 (튜토리얼 완료 후에만)
    this.hintInterval = setInterval(() => this.checkHint(), 5000);
  }
  
  /**
   * localStorage에서 튜토리얼 완료 여부 로드
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.completed = data.completed || false;
      }
    } catch (e) {
      console.warn('Tutorial load failed:', e);
    }
  }
  
  /**
   * localStorage에 저장
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completed: this.completed,
      }));
    } catch (e) {
      console.warn('Tutorial save failed:', e);
    }
  }
  
  /**
   * 인트로 + 첫 단계 안내
   */
  showIntro() {
    if (this.completed) {
      setTimeout(() => {
        this.game.print('');
        this.game.print('[시스템] 튜토리얼 완료됨. 자유롭게 플레이하세요.', 'system');
        this.game.print('[TIP] help 로 명령어 목록을 확인하세요.', 'system');
      }, 500);
      return;
    }

    // 스토리 출력
    let delay = 0;
    MSG.STORY_INTRO.forEach((line) => {
      setTimeout(() => {
        if (line === '') {
          this.game.print('');
        } else if (line.startsWith('경고')) {
          this.game.print(line, 'warning');
        } else if (line.startsWith('[')) {
          this.game.print(line, 'system');
        } else {
          this.game.print(line);
        }
      }, delay);
      delay += line === '' ? 100 : 300;
    });
    
    // 튜토리얼 안내
    setTimeout(() => {
      this.game.print('');
      this.game.print('╔════════════════════════════════════╗', 'warning');
      this.game.print('║         [기초 훈련 프로토콜]       ║', 'warning');
      this.game.print('╚════════════════════════════════════╝', 'warning');
      this.game.print('');
      this.game.print('지시에 따라 시스템 사용법을 익히세요.', 'system');
      this.game.print('');
      this.showCurrentStep();
    }, delay + 800);
  }
  
  /**
   * 현재 단계 안내 출력
   */
  showCurrentStep() {
    if (this.completed || this.currentStep >= this.steps.length) return;
    
    const step = this.steps[this.currentStep];
    const progress = `[${this.currentStep + 1}/${this.steps.length}]`;
    
    this.game.print(`${progress} ${step.instruction}`, 'info'); // warning -> info (덜 위협적)
    this.lastInputTime = Date.now();
  }
  
  /**
   * 명령어 입력 시 호출
   * @returns {boolean} 튜토리얼이 명령을 가로챘는지 (true면 원래 명령 실행 안 함)
   */
  onCommand(cmd) {
    this.lastInputTime = Date.now();
    
    // 이미 완료된 경우 통과
    if (this.completed) {
      return false;
    }
    
    const step = this.steps[this.currentStep];
    if (!step) return false;
    
    // 명령어 검증
    const isCorrect = step.validate 
      ? step.validate(cmd) 
      : cmd === step.command;
    
    if (isCorrect) {
      // 정답!
      if (step.onComplete) {
        step.onComplete();
      }
      
      this.currentStep++;
      
      // 완료 체크 (마지막 단계였으면)
      if (this.currentStep >= this.steps.length) {
        this.completeTutorial();
      } else {
        // 다음 단계 안내
        setTimeout(() => {
          this.game.print('');
          this.showCurrentStep();
        }, 500);
      }
      
      return false; // 명령은 정상 실행 (Game.js가 처리)
    } else {
      // 틀린 명령 -> 부드러운 차단 메시지
      // help는 항상 허용
      if (cmd === 'help') return false;
      
      this.game.print('');
      this.game.print(`⚠ 훈련 프로토콜 대기 중...`, 'warning');
      this.game.print(`지금은 다음 명령을 수행해야 합니다: ${step.command}`, 'system');
      
      return true; // 명령 가로챔 (실행 안 함)
    }
  }
  
  /**
   * 튜토리얼 완료 처리
   */
  completeTutorial() {
    this.completed = true;
    this.save();
    
    // 업적 처리
    if (this.game.achievements) {
      this.game.achievements.check('tutorial_complete');
    }
    
    // Game.js의 victory()가 메시지 출력하므로 여기선 생략 가능하지만,
    // 명시적인 완료 로그 남김
    setTimeout(() => {
      this.game.print('');
      this.game.print('🎉 훈련 완료! 실전 투입 준비됨.', 'success');
    }, 1000);
  }
  
  /**
   * 튜토리얼 완료 여부
   */
  isCompleted() {
    return this.completed;
  }
  
  /**
   * 힌트 체크 (튜토리얼 완료 후 자유 플레이 시)
   */
  checkHint() {
    if (!this.completed || !this.enabled) return;
    if (!this.game.state.running || this.game.state.paused) return;
    
    const idle = Date.now() - this.lastInputTime;
    if (idle < 15000) return; // 15초 대기
    
    const { resources, enemy } = this.game.state;
    
    // 긴급 상황 힌트
    if (resources.o2 < 20) {
      this.showHint('[TIP] 산소가 부족합니다! 서두르세요.');
      return;
    }
    
    if (enemy.distance <= 2) {
      this.showHint('[TIP] 적이 가깝습니다! hide 로 숨거나 빠르게 이동하세요.');
      return;
    }
  }
  
  /**
   * 힌트 출력
   */
  showHint(msg) {
    this.game.print('');
    this.game.print(msg, 'system');
    this.lastInputTime = Date.now();
  }
  
  /**
   * 튜토리얼 리셋 (디버그용)
   */
  reset() {
    this.completed = false;
    this.currentStep = 0;
    localStorage.removeItem(STORAGE_KEY);
  }
  
  /**
   * 정리
   */
  destroy() {
    if (this.hintInterval) {
      clearInterval(this.hintInterval);
      this.hintInterval = null;
    }
  }
}
