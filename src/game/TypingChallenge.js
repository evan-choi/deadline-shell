/**
 * TypingChallenge - 타이핑 이벤트 시스템
 * 특정 커맨드(repair 등) 실행 시 타이핑 챌린지 발생
 */

export class TypingChallenge {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.currentPhrase = '';
    this.onSuccess = null;
    this.onFail = null;
    this.timeLimit = 10000; // 10초
    this.timer = null;
    this.startTime = 0;
    
    // 타이핑 문구 풀
    this.phrases = {
      reactor: [
        'systemctl restart reactor-core',
        'sudo repair --target=coolant',
        'init 3 && sync reactor',
      ],
      security: [
        'override --auth=bypass',
        'chmod 777 /security/lock',
        'sudo disable firewall',
      ],
      airlock: [
        'pressurize --chamber=main',
        'seal-check --all',
        'hatch open --confirm',
      ],
      generic: [
        'sudo systemctl restart',
        'repair --force',
        'diagnose -v --fix',
      ],
    };
  }
  
  /**
   * 챌린지 시작
   * @param {string} type - 챌린지 타입 (reactor, security, airlock, generic)
   * @param {Function} onSuccess - 성공 콜백
   * @param {Function} onFail - 실패 콜백
   */
  start(type, onSuccess, onFail) {
    const pool = this.phrases[type] || this.phrases.generic;
    this.currentPhrase = pool[Math.floor(Math.random() * pool.length)];
    this.onSuccess = onSuccess;
    this.onFail = onFail;
    this.active = true;
    this.startTime = Date.now();
    
    // 챌린지 UI 표시
    this.game.print('');
    this.game.print('=== 타이핑 챌린지 ===', 'warning');
    this.game.print('아래 명령어를 정확히 입력하세요:', 'system');
    this.game.print('');
    this.game.print(`  ${this.currentPhrase}`, 'success');
    this.game.print('');
    this.game.print(`제한 시간: ${this.timeLimit / 1000}초`, 'system');
    this.game.print('');
    
    // 타이머 시작
    this.timer = setTimeout(() => {
      this.fail('시간 초과!');
    }, this.timeLimit);
    
    return true;
  }
  
  /**
   * 입력 검증 (Game에서 호출)
   * @returns {boolean} 챌린지가 입력을 처리했는지
   */
  checkInput(input) {
    if (!this.active) return false;
    
    const trimmed = input.trim();
    
    if (trimmed === this.currentPhrase) {
      this.success();
    } else {
      // 오타 페널티
      this.game.state.resources.noise = Math.min(
        100, 
        this.game.state.resources.noise + 5
      );
      this.game.print('오타! 소음이 증가합니다. 다시 입력하세요.', 'error');
      this.game.triggerError();
    }
    
    return true; // 입력 처리됨
  }
  
  /**
   * 성공 처리
   */
  success() {
    this.cleanup();
    
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    this.game.print(`✓ 완료! (${elapsed}초)`, 'success');
    this.game.print('');
    
    if (this.onSuccess) {
      this.onSuccess();
    }
  }
  
  /**
   * 실패 처리
   */
  fail(reason) {
    this.cleanup();
    
    this.game.print(`✗ 실패: ${reason}`, 'error');
    this.game.print('');
    this.game.triggerError();
    
    // 실패 페널티
    this.game.state.resources.noise = Math.min(
      100, 
      this.game.state.resources.noise + 10
    );
    
    if (this.onFail) {
      this.onFail();
    }
  }
  
  /**
   * 정리
   */
  cleanup() {
    this.active = false;
    this.currentPhrase = '';
    this.onSuccess = null;
    this.onFail = null;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  
  /**
   * 챌린지 활성 상태 확인
   */
  isActive() {
    return this.active;
  }
  
  /**
   * 남은 시간 (초)
   */
  getRemainingTime() {
    if (!this.active) return 0;
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, (this.timeLimit - elapsed) / 1000);
  }
}
