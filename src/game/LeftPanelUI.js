/**
 * LeftPanelUI - 시스템 알림 및 활성 효과 패널
 */

export class LeftPanelUI {
  constructor() {
    this.logEl = document.getElementById('system-log');
    this.effectsEl = document.getElementById('active-effects');
  }
  
  /**
   * 시스템 로그 추가
   * @param {string} msg - 메시지 내용
   * @param {string} type - info, warning, error, success
   */
  logEvent(msg, type = 'info') {
    if (!this.logEl) return;
    
    const line = document.createElement('div');
    line.className = `system-msg ${type}`;
    line.textContent = msg;
    
    // 타임스탬프 (선택 사항, 일단 생략)
    
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
  
  /**
   * 활성 효과 업데이트
   * @param {string[]} effects - 활성 효과 목록
   */
  updateEffects(effects) {
    if (!this.effectsEl) return;
    
    if (!effects || effects.length === 0) {
      this.effectsEl.innerHTML = '<div class="empty-message">- 없음 -</div>';
      return;
    }
    
    this.effectsEl.innerHTML = effects.map(effect => `
      <div class="effect-item">⚠ ${effect}</div>
    `).join('');
  }
}
