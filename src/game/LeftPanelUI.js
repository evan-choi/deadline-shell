/**
 * LeftPanelUI - 좌측 패널 시스템 상태 표시
 * 
 * 역할:
 * 1. 활성 이벤트 상태 표시 (실시간 타이머 바)
 * 2. 시스템 알림 로그 (최근 메시지만)
 */

export class LeftPanelUI {
  constructor() {
    this.logEl = document.getElementById('system-log');
    this.effectsEl = document.getElementById('active-effects');
    this.maxLogs = 6;
  }

  /**
   * 시스템 로그 추가
   */
  logEvent(msg, type = 'info') {
    if (!this.logEl) return;

    const line = document.createElement('div');
    line.className = `system-msg ${type}`;
    line.textContent = msg;

    this.logEl.appendChild(line);

    // 최대 개수 초과 시 오래된 것 제거
    while (this.logEl.children.length > this.maxLogs) {
      this.logEl.removeChild(this.logEl.firstChild);
    }

    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  /**
   * 활성 이벤트 상태 업데이트
   * @param {Array} events - [{id, name, nameEn, icon, type, remaining, maxDuration, detail}]
   */
  updateEffects(events) {
    if (!this.effectsEl) return;

    if (!events || events.length === 0) {
      this.effectsEl.innerHTML = `
        <div class="effect-empty">
          <span class="effect-status-icon">✓</span>
          <span>시스템 정상</span>
        </div>
      `;
      return;
    }

    this.effectsEl.innerHTML = events.map(event => {
      const pct = event.maxDuration ? Math.round((event.remaining / event.maxDuration) * 100) : 100;
      return `
        <div class="effect-card ${event.type || 'warning'}">
          <div class="effect-header">
            <span class="effect-icon">${event.icon || '⚠'}</span>
            <span class="effect-name">${event.nameEn || event.name}</span>
            <span class="effect-timer">${event.remaining}s</span>
          </div>
          <div class="effect-bar-bg">
            <div class="effect-bar" style="width: ${pct}%"></div>
          </div>
          ${event.detail ? `<div class="effect-detail">${event.detail}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * 플래시 효과
   */
  flash(type = 'warning') {
    if (!this.effectsEl) return;
    this.effectsEl.classList.add(`flash-${type}`);
    setTimeout(() => this.effectsEl.classList.remove(`flash-${type}`), 300);
  }
}
