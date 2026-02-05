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
    
    this.steps = [
      { id: 'status', command: 'status', instruction: '현재 상태를 확인하세요.', hint: 'status 를 입력하세요.' },
      { id: 'scan', command: 'scan', instruction: '주변을 스캔하여 적의 위치를 파악하세요.', hint: 'scan 을 입력하세요.' },
      { id: 'map', command: 'map', instruction: '지도를 확인하여 정거장 구조를 파악하세요.', hint: 'map 을 입력하세요.' },
      { id: 'move', command: 'cd storage', instruction: 'storage 로 이동하세요.', hint: 'cd storage 를 입력하세요.', validate: (cmd) => cmd === 'cd storage' },
      { id: 'move2', command: 'cd security', instruction: 'security 로 이동하세요.', hint: 'cd security 를 입력하세요.', validate: (cmd) => cmd === 'cd security' },
      { id: 'su', command: 'su', instruction: '관리자 권한을 획득하세요.', hint: 'su 를 입력하세요.' },
      { id: 'objectives', command: 'objectives', instruction: '탈출 목표를 확인하세요.', hint: 'objectives 를 입력하세요.' },
      { id: 'hide', command: 'hide', instruction: 'hide 로 숨어보세요.', hint: 'hide 를 입력하세요.' },
    ];
    
    this.currentStep = 0;
    this.completed = false;
    this.enabled = true;
    this.lastInputTime = Date.now();
    this.hintInterval = null;
    
    this.load();
    this.hintInterval = setInterval(() => this.checkHint(), 5000);
  }
  
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.completed = data.completed || false;
      }
    } catch (e) { console.warn('Tutorial load failed:', e); }
  }
  
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: this.completed }));
    } catch (e) { console.warn('Tutorial save failed:', e); }
  }
  
  showIntro() {
    let delay = 0;
    MSG.STORY_INTRO.forEach((line) => {
      setTimeout(() => {
        if (line === '') this.game.print('');
        else if (line.startsWith('경고')) this.game.print(line, 'warning');
        else if (line.startsWith('[')) this.game.print(line, 'system');
        else this.game.print(line);
      }, delay);
      delay += line === '' ? 100 : 300;
    });
    
    setTimeout(() => {
      this.game.print('');
      if (this.completed) {
        this.game.print('[시스템] 튜토리얼 완료됨. 자유롭게 플레이하세요.', 'system');
        this.game.print('[TIP] help 로 명령어 목록을 확인하세요.', 'system');
      } else {
        this.game.print('╔════════════════════════════════════╗', 'warning');
        this.game.print('║         [튜토리얼 시작]            ║', 'warning');
        this.game.print('╚════════════════════════════════════╝', 'warning');
        this.game.print('');
        this.showCurrentStep();
      }
    }, delay + 800);
  }
  
  showCurrentStep() {
    if (this.completed || this.currentStep >= this.steps.length) return;
    const step = this.steps[this.currentStep];
    this.game.print(`[${this.currentStep + 1}/${this.steps.length}] ${step.instruction}`, 'warning');
    this.game.print(`    → ${step.hint}`, 'system');
    this.lastInputTime = Date.now();
  }
  
  /**
   * 명령 실행 전 호출 (힌트 표시용)
   */
  beforeExecute(cmd) {
    this.lastInputTime = Date.now();
    // 튜토리얼 중이면 힌트만 표시, 차단은 안 함
  }
  
  /**
   * 명령 실행 후 호출 (진행 처리)
   */
  onExecuted(cmd, success) {
    if (this.completed || !success) return;
    
    const step = this.steps[this.currentStep];
    if (!step) return;
    
    const isCorrect = step.validate ? step.validate(cmd) : cmd === step.command;
    
    if (isCorrect) {
      this.currentStep++;
      if (this.currentStep >= this.steps.length) {
        this.completeTutorial();
      } else {
        setTimeout(() => {
          this.game.print('');
          this.showCurrentStep();
        }, 300);
      }
    }
  }
  
  completeTutorial() {
    this.completed = true;
    this.save();
    this.game.print('');
    this.game.print('🎉 튜토리얼 완료! 자유롭게 플레이하세요.', 'success');
    this.game.print('[TIP] objectives 로 목표 확인, airlock 에서 escape 로 탈출!', 'system');
    if (this.game.achievements) this.game.achievements.check('tutorial_complete');
  }
  
  markCompleted() {
    this.completed = true;
    this.save();
  }
  
  isCompleted() { return this.completed; }
  isInProgress() { return !this.completed && this.currentStep < this.steps.length; }
  
  checkHint() {
    if (!this.completed || !this.enabled) return;
    if (!this.game.state.running || this.game.state.paused) return;
    const idle = Date.now() - this.lastInputTime;
    if (idle < 15000) return;
    
    const { resources, enemy } = this.game.state;
    if (resources.o2 < 20) { this.game.print('[TIP] 산소 부족! 서두르세요.', 'system'); this.lastInputTime = Date.now(); }
    else if (enemy.distance <= 2) { this.game.print('[TIP] 적이 가깝습니다! hide 또는 이동하세요.', 'system'); this.lastInputTime = Date.now(); }
  }
  
  destroy() {
    if (this.hintInterval) { clearInterval(this.hintInterval); this.hintInterval = null; }
  }
}
