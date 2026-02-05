/**
 * Tutorial - 강제 단계형 튜토리얼
 * 첫 런: 정해진 순서대로만 진행
 * 완료 후: 자유 플레이 + 힌트 시스템
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
          this.game.print('[튜토리얼] 소음이 높으면 적이 접근합니다. 주의하세요.', 'system');
        },
      },
      {
        id: 'scan',
        instruction: '주변을 스캔하여 적의 위치를 파악하세요.',
        command: 'scan',
        hint: 'scan 을 입력하세요.',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 적과의 거리를 확인했습니다.', 'success');
          this.game.print('[튜토리얼] 거리가 0이 되면 게임 오버입니다!', 'warning');
        },
      },
      {
        id: 'map',
        instruction: '지도를 확인하여 정거장 구조를 파악하세요.',
        command: 'map',
        hint: 'map 을 입력하세요.',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 정거장 지도를 확인했습니다.', 'success');
          this.game.print('[튜토리얼] 🔒 표시는 잠긴 구역입니다.', 'system');
        },
      },
      {
        id: 'move',
        instruction: 'storage 로 이동하세요.',
        command: 'cd storage',
        hint: 'cd storage 를 입력하세요.',
        validate: (cmd) => cmd === 'cd storage',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 다른 방으로 이동했습니다!', 'success');
          this.game.print('[튜토리얼] 이동하면 소음이 발생합니다.', 'system');
        },
      },
      {
        id: 'move2',
        instruction: 'security 로 이동하세요. (권한 획득 장소)',
        command: 'cd security',
        hint: 'cd security 를 입력하세요.',
        validate: (cmd) => cmd === 'cd security',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 보안실에 도착했습니다.', 'success');
          this.game.print('[튜토리얼] 여기서 권한을 획득할 수 있습니다.', 'warning');
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
          this.game.print('[튜토리얼] engineer 권한을 획득했습니다!', 'success');
          this.game.print('[튜토리얼] 이제 repair 명령을 사용할 수 있습니다.', 'system');
        },
      },
      {
        id: 'objectives',
        instruction: '탈출 목표를 확인하세요.',
        command: 'objectives',
        hint: 'objectives 를 입력하세요.',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 탈출 목표를 확인했습니다.', 'success');
          this.game.print('[튜토리얼] 3개 중 2개를 완료하면 탈출할 수 있습니다!', 'warning');
        },
      },
      {
        id: 'hide',
        instruction: '적이 가까워지면 hide 로 숨을 수 있습니다. 한 번 시도해보세요.',
        command: 'hide',
        hint: 'hide 를 입력하세요.',
        onComplete: () => {
          this.game.print('');
          this.game.print('[튜토리얼] 숨기 성공! 소음이 초기화되고 적이 멀어집니다.', 'success');
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
      
      if (this.completed) {
        // 이미 완료한 경우
        this.game.print('[시스템] 튜토리얼 완료됨. 자유롭게 플레이하세요.', 'system');
        this.game.print('[TIP] help 로 명령어 목록을 확인하세요.', 'system');
      } else {
        // 튜토리얼 시작
        this.game.print('╔════════════════════════════════════╗', 'warning');
        this.game.print('║         [튜토리얼 시작]            ║', 'warning');
        this.game.print('╚════════════════════════════════════╝', 'warning');
        this.game.print('');
        this.game.print('지시에 따라 명령어를 입력하세요.', 'system');
        this.game.print('튜토리얼 완료 후 자유롭게 플레이할 수 있습니다.', 'system');
        this.game.print('');
        this.showCurrentStep();
      }
    }, delay + 800);
  }
  
  /**
   * 현재 단계 안내 출력
   */
  showCurrentStep() {
    if (this.completed || this.currentStep >= this.steps.length) return;
    
    const step = this.steps[this.currentStep];
    const progress = `[${this.currentStep + 1}/${this.steps.length}]`;
    
    this.game.print(`${progress} ${step.instruction}`, 'warning');
    this.game.print(`    → ${step.hint}`, 'system');
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
      
      // 다음 단계 또는 완료
      setTimeout(() => {
        if (this.currentStep >= this.steps.length) {
          this.completeTutorial();
        } else {
          this.game.print('');
          this.showCurrentStep();
        }
      }, 500);
      
      return false; // 명령은 정상 실행
    } else {
      // 틀린 명령
      // help는 항상 허용
      if (cmd === 'help') {
        return false;
      }
      
      this.game.print('');
      this.game.print(`[튜토리얼] 지금은 "${step.command}" 를 입력해야 합니다.`, 'error');
      this.game.print(`    → ${step.hint}`, 'system');
      
      return true; // 명령 가로챔 (실행 안 함)
    }
  }
  
  /**
   * 튜토리얼 완료 처리
   */
  completeTutorial() {
    this.completed = true;
    this.save();
    
    this.game.print('');
    this.game.print('╔════════════════════════════════════╗', 'success');
    this.game.print('║       🎉 튜토리얼 완료! 🎉         ║', 'success');
    this.game.print('╚════════════════════════════════════╝', 'success');
    this.game.print('');
    this.game.print('이제 자유롭게 플레이하세요!', 'system');
    this.game.print('');
    this.game.print('목표:', 'warning');
    this.game.print('  1. 목표 2개 이상 완료 (repair)', 'system');
    this.game.print('  2. airlock 으로 이동', 'system');
    this.game.print('  3. escape 로 탈출!', 'system');
    this.game.print('');
    this.game.print('[TIP] help 로 명령어 목록을 확인하세요.', 'system');
    this.game.print('[TIP] objectives 로 목표를 확인하세요.', 'system');
    
    // 업적 처리
    if (this.game.achievements) {
      this.game.achievements.check('tutorial_complete');
    }
  }
  
  /**
   * 튜토리얼 완료 여부
   */
  isCompleted() {
    return this.completed;
  }
  
  /**
   * 튜토리얼 진행 중 여부
   */
  isInProgress() {
    return !this.completed && this.currentStep < this.steps.length;
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
