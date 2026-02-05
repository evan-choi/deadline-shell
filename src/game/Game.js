/**
 * Game - Core game logic for DEADLINE SHELL
 * 커맨드는 영어, 설명은 한글
 * 
 * 모듈화: 커맨드 로직은 commands/ 폴더로 분리됨
 */

import { MSG } from './messages.js';
import { Tutorial } from './Tutorial.js';
import { Objectives } from './Objectives.js';
import { TypingChallenge } from './TypingChallenge.js';
import { Events } from './Events.js';
import { Meta } from './Meta.js';
import { GameMap } from './Map.js';
import { Achievements } from './Achievements.js';
import { AchievementsUI } from './AchievementsUI.js';
import { LeftPanelUI } from './LeftPanelUI.js';

// Commands (모듈화)
import { cmdHelp, cmdStatus, cmdScan, cmdLs, cmdObjectives, cmdMap } from './commands/core.js';
import { cmdCd, cmdRun, cmdHide } from './commands/move.js';
import { cmdRepair, cmdLogin, cmdSu, cmdLockDoor, cmdUnlockDoor, cmdUnlockRoom, cmdEscape } from './commands/action.js';
import { cmdShop, cmdBuy, cmdUse, cmdStats } from './commands/meta.js';

export class Game {
  constructor({ outputEl, inputEl, promptEl, hudEl, terminalEl, crt }) {
    this.outputEl = outputEl;
    this.inputEl = inputEl;
    this.promptEl = promptEl;
    this.hudEl = hudEl;
    this.terminalEl = terminalEl;
    this.crt = crt;
    
    // Game state
    this.state = {
      running: false,
      paused: false,
      permission: 'guest',
      location: 'hub',
      resources: {
        hp: 100,
        o2: 100,
        power: 50,
        noise: 0,
      },
      time: 0,
      enemy: { distance: 5 },
      doorLocked: false,
      earlyDrainRelief: false,
      hasEmergencyO2: false,
      hasTempSuToken: false,
      hasEngineerKeycard: false,
    };
    
    this.tickInterval = null;
    this.history = [];
    this.historyIndex = -1;
    
    // Panels
    this.leftPanel = new LeftPanelUI();
    
    // Modules
    this.tutorial = new Tutorial(this);
    this.objectives = new Objectives(this);
    this.typingChallenge = new TypingChallenge(this);
    this.events = new Events(this);
    this.meta = new Meta(this);
    this.map = new GameMap(this);
    
    // Achievements
    this.achievements = new Achievements(this);
    this.achievementsUI = new AchievementsUI(this.achievements, this.meta);
    
    this.inputEl.addEventListener('keydown', (e) => this.handleInput(e));
  }
  
  start() {
    this.state.running = true;
    this.state.paused = false;
    
    this.achievements.resetRunFlags();
    const bonuses = this.meta.applyStartBonuses();
    this.tutorial.showIntro();
    
    this.leftPanel.logEvent('시스템 모니터링 시작', 'info');
    
    if (this.tutorial.isCompleted()) {
      if (this.map.lockedRooms.size > 0) {
        const locked = Array.from(this.map.lockedRooms).map(r => MSG.ROOMS[r]).join(', ');
        this.leftPanel.logEvent(`🔒 잠긴 구역: ${locked}`, 'warning');
      }
      if (bonuses.length > 0) {
        bonuses.forEach(b => this.leftPanel.logEvent(`✓ 시작 보너스: ${b}`, 'success'));
      }
    } else {
      this.leftPanel.logEvent('튜토리얼 런: 이벤트/잠금 비활성화', 'info');
    }
    
    setTimeout(() => {
      this.tickInterval = setInterval(() => this.tick(), 1000);
    }, 1200);
    
    this.updateHUD();
    this.inputEl.focus();
    
    this.achievements.checkRuns(this.meta.saved.stats.totalRuns);
    this.achievements.checkTotalData(this.meta.saved.totalData);
  }
  
  pause() {
    this.state.paused = true;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
  
  resume() {
    if (this.state.running && this.state.paused) {
      this.state.paused = false;
      this.tickInterval = setInterval(() => this.tick(), 1000);
    }
  }
  
  tick() {
    if (this.state.paused) return;
    
    const { resources, enemy } = this.state;
    
    // O2 drain
    if (!(this.state.earlyDrainRelief && this.state.time < 30)) {
      resources.o2 = Math.max(0, resources.o2 - 1);
    }
    
    // Noise decay
    resources.noise = Math.max(0, resources.noise - 1);
    this.state.time++;
    
    // Enemy movement
    if (this.state.time % 3 === 0 && resources.noise > 30) {
      enemy.distance = Math.max(0, enemy.distance - 1);
    }
    
    // Danger escape counter
    if (enemy.distance === 1) {
      this.meta.onDangerEscape();
      this.achievements.check('danger_escape');
    }
    
    // Events
    this.events.tick();
    
    // Hints
    this.tutorial.checkHint();
    
    // Update UI
    this.updateHUD();
    this.updateCRT();
    this.achievementsUI.updateStats();
    
    // Death check
    if (resources.o2 <= 0 || resources.hp <= 0 || enemy.distance === 0) {
      this.gameOver();
    }
  }
  
  handleInput(e) {
    if (e.key === 'Enter') {
      const command = this.inputEl.value.trim();
      if (command) {
        this.history.push(command);
        this.historyIndex = this.history.length;
        
        if (this.typingChallenge.isActive()) {
          this.print(`> ${command}`);
          this.typingChallenge.checkInput(command);
        } else {
          this.executeCommand(command);
        }
      }
      this.inputEl.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.inputEl.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.inputEl.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.inputEl.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.autoComplete();
    }
  }
  
  autoComplete() {
    const input = this.inputEl.value.toLowerCase();
    const commands = [
      'help', 'status', 'scan', 'cd', 'run', 'ls', 'map', 'objectives',
      'hide', 'repair', 'login', 'su', 'lock', 'unlock', 'escape',
      'shop', 'stats', 'buy', 'use', 'achievements'
    ];
    const match = commands.find(cmd => cmd.startsWith(input));
    if (match) this.inputEl.value = match;
  }
  
  executeCommand(command) {
    const normalized = command.trim().toLowerCase();
    
    this.tutorial.beforeExecute(normalized);
    this.print(`> ${command}`);
    
    if (this.events.checkGlitchFail()) {
      this.tutorial.onExecuted(normalized, false);
      return;
    }
    
    const parts = normalized.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    // Meta commands don't make noise
    const metaCmds = ['shop', 'stats', 'buy', 'achievements'];
    if (!metaCmds.includes(cmd)) {
      this.state.resources.noise = Math.min(100, this.state.resources.noise + 2);
    }
    
    this.achievements.check('command', { cmd: normalized });
    
    let success = true;
    
    switch (cmd) {
      case 'help': cmdHelp(this); break;
      case 'status': cmdStatus(this); break;
      case 'scan': success = cmdScan(this); break;
      case 'cd': success = cmdCd(this, args[0]); break;
      case 'run': success = cmdRun(this, args[0]); break;
      case 'ls': cmdLs(this); break;
      case 'map': cmdMap(this); break;
      case 'objectives': cmdObjectives(this); break;
      case 'hide': cmdHide(this); break;
      case 'repair': success = cmdRepair(this); break;
      case 'login': success = cmdLogin(this, args[0]); break;
      case 'su': success = cmdSu(this); break;
      case 'escape': success = cmdEscape(this); break;
      case 'lock':
        if (args[0] === 'door') { cmdLockDoor(this); }
        else { this.print(MSG.CMD_NOT_FOUND(cmd), 'error'); success = false; }
        break;
      case 'unlock':
        if (args[0] === 'door') { cmdUnlockDoor(this); }
        else if (args[0]) { success = cmdUnlockRoom(this, args[0]); }
        else { this.print(MSG.CMD_NOT_FOUND(cmd), 'error'); success = false; }
        break;
      case 'shop': cmdShop(this); break;
      case 'stats': cmdStats(this); break;
      case 'buy': success = cmdBuy(this, parseInt(args[0])); break;
      case 'use': success = cmdUse(this, args[0]); break;
      case 'achievements': this.achievements.showList(); break;
      default:
        this.print(MSG.CMD_NOT_FOUND(cmd), 'error');
        this.triggerError();
        success = false;
    }
    
    this.tutorial.onExecuted(normalized, success);
    this.updateHUD();
    this.updateCRT();
  }
  
  // ========== UI Methods ==========
  
  print(text, type = 'default') {
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = text;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  printHTML(html) {
    const line = document.createElement('div');
    line.className = 'output-line';
    line.innerHTML = html;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  clearOutput() {
    this.outputEl.innerHTML = '';
  }
  
  updateHUD() {
    const { resources, permission, location, time, enemy } = this.state;
    const roomKr = MSG.ROOMS[location] || location;
    const permKr = MSG.PERMISSION[permission] || permission;
    
    this.hudEl.innerHTML = `
      <span class="hud-item">HP: ${resources.hp}</span>
      <span class="hud-item ${resources.o2 < 30 ? 'danger' : ''}">O2: ${resources.o2}%</span>
      <span class="hud-item">⚡${resources.power}</span>
      <span class="hud-item ${resources.noise > 50 ? 'warning' : ''}">🔊${resources.noise}</span>
      <span class="hud-item">📍${roomKr}</span>
      <span class="hud-item">🔑${permKr}</span>
      <span class="hud-item">⏱${time}s</span>
      <span class="hud-item ${enemy.distance <= 2 ? 'danger' : ''}">👾${enemy.distance}</span>
    `;
    
    this.promptEl.textContent = `${location}@${permission}:~$ `;
  }
  
  updateCRT() {
    if (!this.crt) return;
    
    const { resources, enemy } = this.state;
    let intensity = 0;
    if (resources.o2 < 30) intensity += 0.3;
    if (enemy.distance <= 2) intensity += 0.4;
    if (resources.hp < 50) intensity += 0.2;
    
    this.crt.updateFromGameState({ noise: this.state.resources.noise, enemyDistance: this.state.enemy.distance });
  }
  
  triggerError() {
    if (this.crt) {
      this.crt.glitch(200);
    }
    this.terminalEl?.classList.add('shake');
    setTimeout(() => {
      this.terminalEl?.classList.remove('shake');
    }, 200);
  }
  
  // ========== Game End States ==========
  
  gameOver() {
    this.state.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    const { resources, enemy, time } = this.state;
    let cause = '알 수 없는 원인';
    
    if (resources.o2 <= 0) cause = '산소 고갈';
    else if (resources.hp <= 0) cause = '체력 소진';
    else if (enemy.distance === 0) cause = '적에게 발각';
    
    this.print('');
    this.print('========================================', 'error');
    this.print('  G A M E   O V E R', 'error');
    this.print(`  사망 원인: ${cause}`, 'error');
    this.print(`  생존 시간: ${time}초`, 'error');
    this.print('========================================', 'error');
    this.print('');
    
    this.meta.onGameOver();
    
    const earnedData = Math.floor(time / 10) + this.objectives.getCompletedCount() * 5;
    this.meta.addData(earnedData);
    this.print(`획득 DATA: ${earnedData}`, 'system');
    this.print('');
    this.print('페이지를 새로고침하여 재시작하세요.', 'system');
    
    this.achievementsUI.updateStats();
  }
  
  victory() {
    this.state.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    const { time } = this.state;
    
    this.print('');
    this.print('========================================', 'success');
    this.print('  🎉 탈출 성공! 🎉', 'success');
    this.print(`  클리어 시간: ${time}초`, 'success');
    this.print('========================================', 'success');
    this.print('');
    
    this.meta.onVictory(time);
    
    const timeBonus = Math.max(0, 100 - time);
    const earnedData = 50 + timeBonus;
    this.meta.addData(earnedData);
    this.print(`획득 DATA: ${earnedData} (기본 50 + 시간 보너스 ${timeBonus})`, 'system');
    
    this.achievements.check('escape');
    this.achievements.check('speed', { time });
    this.achievements.check('no_damage');
    
    if (!this.tutorial.isCompleted()) {
      this.tutorial.markCompleted();
      this.print('');
      this.print('🎓 튜토리얼 완료! 다음 런부터 랜덤 요소가 활성화됩니다.', 'success');
    }
    
    this.print('');
    this.print('페이지를 새로고침하여 재시작하세요.', 'system');
    
    this.achievementsUI.updateStats();
  }
}
