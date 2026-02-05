/**
 * AchievementsUI - 업적 사이드바 + 토스트 UI 관리
 */

export class AchievementsUI {
  constructor(achievements, meta) {
    this.achievements = achievements;
    this.meta = meta;
    
    // DOM 요소
    this.sidebar = document.getElementById('achievements-sidebar');
    this.progressEl = document.getElementById('achievement-progress');
    this.recentListEl = document.getElementById('recent-achievements');
    this.progressListEl = document.getElementById('progress-achievements');
    this.toast = document.getElementById('achievement-toast');
    this.toastNameEl = document.getElementById('toast-achievement-name');
    this.toastRewardEl = document.getElementById('toast-achievement-reward');
    
    // 통계 요소
    this.statDataEl = document.getElementById('stat-data');
    this.statRunsEl = document.getElementById('stat-runs');
    this.statEscapesEl = document.getElementById('stat-escapes');
    
    // 토스트 큐
    this.toastQueue = [];
    this.toastShowing = false;
    
    // 최근 달성 업적 (최대 3개)
    this.recentUnlocked = [];
    
    // 초기 렌더링
    this.render();
  }
  
  /**
   * 전체 UI 업데이트
   */
  render() {
    this.renderProgress();
    this.renderRecentAchievements();
    this.renderProgressAchievements();
    this.renderStats();
  }
  
  /**
   * 진행률 업데이트
   */
  renderProgress() {
    const list = Object.values(this.achievements.list);
    const unlocked = list.filter(a => a.unlocked).length;
    const total = list.length;
    
    if (this.progressEl) {
      this.progressEl.textContent = `${unlocked}/${total}`;
    }
  }
  
  /**
   * 최근 달성 업적 렌더링
   */
  renderRecentAchievements() {
    if (!this.recentListEl) return;
    
    // 해금된 업적 중 최근 3개
    const unlocked = Object.values(this.achievements.list)
      .filter(a => a.unlocked)
      .slice(-3)
      .reverse();
    
    if (unlocked.length === 0) {
      this.recentListEl.innerHTML = '<div class="empty-message">아직 없음</div>';
      return;
    }
    
    this.recentListEl.innerHTML = unlocked.map(a => `
      <div class="achievement-item unlocked">
        <div class="achievement-name">
          <span class="achievement-icon">🏆</span>
          ${a.name}
        </div>
      </div>
    `).join('');
  }
  
  /**
   * 진행 중 업적 렌더링 (미달성 중 힌트가 될만한 것들)
   */
  renderProgressAchievements() {
    if (!this.progressListEl) return;
    
    // 미달성 + 숨기지 않은 업적 중 상위 4개
    const inProgress = Object.values(this.achievements.list)
      .filter(a => !a.unlocked && !a.hidden)
      .slice(0, 4);
    
    if (inProgress.length === 0) {
      this.progressListEl.innerHTML = '<div class="empty-message">모두 달성!</div>';
      return;
    }
    
    this.progressListEl.innerHTML = inProgress.map(a => `
      <div class="achievement-item">
        <div class="achievement-name">
          <span class="achievement-icon">○</span>
          ${a.name}
        </div>
        <div class="achievement-desc">${a.desc}</div>
        <div class="achievement-reward">+${a.reward} DATA</div>
      </div>
    `).join('');
  }
  
  /**
   * 통계 렌더링
   */
  renderStats() {
    if (!this.meta || !this.meta.saved) return;
    
    const stats = this.meta.saved.stats || {};
    
    if (this.statDataEl) {
      this.statDataEl.textContent = this.meta.saved.totalData || 0;
    }
    if (this.statRunsEl) {
      this.statRunsEl.textContent = stats.totalRuns || 0;
    }
    if (this.statEscapesEl) {
      this.statEscapesEl.textContent = stats.totalEscapes || 0;
    }
  }
  
  /**
   * 업적 달성 시 호출 (토스트 표시 + UI 업데이트)
   */
  onUnlock(achievement) {
    // 토스트 큐에 추가
    this.toastQueue.push(achievement);
    this.processToastQueue();
    
    // UI 업데이트
    this.render();
  }
  
  /**
   * 토스트 큐 처리
   */
  processToastQueue() {
    if (this.toastShowing || this.toastQueue.length === 0) return;
    
    const achievement = this.toastQueue.shift();
    this.showToast(achievement);
  }
  
  /**
   * 토스트 표시
   */
  showToast(achievement) {
    if (!this.toast) return;
    
    this.toastShowing = true;
    
    // 내용 설정
    if (this.toastNameEl) {
      this.toastNameEl.textContent = achievement.name;
    }
    if (this.toastRewardEl) {
      this.toastRewardEl.textContent = `+${achievement.reward} DATA`;
    }
    
    // 표시
    this.toast.classList.remove('hidden', 'fade-out');
    
    // 3초 후 페이드아웃
    setTimeout(() => {
      this.toast.classList.add('fade-out');
      
      // 애니메이션 후 숨김
      setTimeout(() => {
        this.toast.classList.add('hidden');
        this.toast.classList.remove('fade-out');
        this.toastShowing = false;
        
        // 다음 토스트 처리
        this.processToastQueue();
      }, 500);
    }, 3000);
  }
  
  /**
   * 통계만 업데이트 (매 틱 또는 이벤트 시)
   */
  updateStats() {
    this.renderStats();
  }
}
