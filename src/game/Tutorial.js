/**
 * Tutorial - 힌트 시스템 (B+C 혼합)
 * - 첫 부팅: 스토리 로그로 상황 설명
 * - 진행 중: 10초 무입력 또는 연속 3회 오류 시 힌트
 */

import { MSG } from './messages.js';

export class Tutorial {
  constructor(game) {
    this.game = game;
    this.enabled = true;
    this.phase = 'start'; // start, after_status, after_scan, exploring
    this.lastInputTime = Date.now();
    this.errorCount = 0;
    this.hintShown = false;
    this.introShown = false;
    
    // 10초마다 힌트 체크
    this.hintInterval = setInterval(() => this.checkHint(), 5000);
  }
  
  /**
   * 첫 부팅 시 스토리 출력
   */
  showIntro() {
    if (this.introShown) return;
    this.introShown = true;
    
    // 스토리 라인을 순차적으로 출력
    let delay = 0;
    MSG.STORY_INTRO.forEach((line, i) => {
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
    
    // 첫 힌트
    setTimeout(() => {
      this.game.print('');
      this.game.print(MSG.STORY_FIRST_TIP, 'system');
      this.lastInputTime = Date.now();
    }, delay + 500);
  }
  
  /**
   * 커맨드 실행 후 phase 업데이트
   */
  onCommand(cmd) {
    this.lastInputTime = Date.now();
    this.errorCount = 0;
    this.hintShown = false;
    
    // phase 진행
    if (cmd === 'status' && this.phase === 'start') {
      this.phase = 'after_status';
    } else if (cmd === 'scan' && this.phase === 'after_status') {
      this.phase = 'after_scan';
    } else if (cmd.startsWith('cd ') && this.phase === 'after_scan') {
      this.phase = 'exploring';
      // 탐험 모드에서는 힌트 빈도 낮춤
    }
  }
  
  /**
   * 에러 발생 시
   */
  onError() {
    this.errorCount++;
    if (this.errorCount >= 3 && !this.hintShown) {
      this.showHint(MSG.HINTS.STUCK);
    }
  }
  
  /**
   * 주기적 힌트 체크 (5초마다)
   */
  checkHint() {
    if (!this.enabled || this.hintShown || !this.game.state.running) return;
    if (this.game.state.paused) return;
    
    const idle = Date.now() - this.lastInputTime;
    
    // 탐험 모드에서는 15초, 그 외에는 10초
    const threshold = this.phase === 'exploring' ? 15000 : 10000;
    if (idle < threshold) return;
    
    const { resources, enemy } = this.game.state;
    
    // 긴급 상황 힌트 (우선)
    if (resources.o2 < 30) {
      this.showHint(MSG.HINTS.LOW_O2);
      return;
    }
    
    if (enemy.distance <= 2) {
      this.showHint(MSG.HINTS.ENEMY_NEAR);
      return;
    }
    
    // phase별 일반 힌트
    const hints = {
      start: MSG.HINTS.START,
      after_status: MSG.HINTS.AFTER_STATUS,
      after_scan: MSG.HINTS.AFTER_SCAN,
    };
    
    if (hints[this.phase]) {
      this.showHint(hints[this.phase]);
    }
  }
  
  /**
   * 힌트 출력
   */
  showHint(msg) {
    this.hintShown = true;
    this.game.print('');
    this.game.print(msg, 'system');
  }
  
  /**
   * 힌트 시스템 토글
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
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
