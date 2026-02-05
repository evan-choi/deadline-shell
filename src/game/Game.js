/**
 * Game - Core game logic for DEADLINE SHELL
 * 커맨드는 영어, 설명은 한글
 */

import { MSG } from './messages.js';
import { Tutorial } from './Tutorial.js';
import { Objectives } from './Objectives.js';
import { TypingChallenge } from './TypingChallenge.js';
import { Events } from './Events.js';
import { Meta } from './Meta.js';

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
      enemy: {
        distance: 5,
      },
      doorLocked: false,
      // 메타 해금 보너스
      earlyDrainRelief: false,
      hasEmergencyO2: false,
      hasTempSuToken: false,
      hasEngineerKeycard: false,
    };
    
    // Tick interval
    this.tickInterval = null;
    
    // Command history
    this.history = [];
    this.historyIndex = -1;
    
    // Modules
    this.tutorial = new Tutorial(this);
    this.objectives = new Objectives(this);
    this.typingChallenge = new TypingChallenge(this);
    this.events = new Events(this);
    this.meta = new Meta(this);
    
    // Bind input handler
    this.inputEl.addEventListener('keydown', (e) => this.handleInput(e));
  }
  
  start() {
    this.state.running = true;
    this.state.paused = false;
    
    // 메타 해금 보너스 적용
    const bonuses = this.meta.applyStartBonuses();
    
    // 인트로 출력
    this.tutorial.showIntro();
    
    // 보너스 표시
    if (bonuses.length > 0) {
      setTimeout(() => {
        this.print('');
        this.print(MSG.START_BONUS_HEADER, 'system');
        bonuses.forEach(b => this.print(`  ✓ ${b}`, 'success'));
        this.print('');
      }, 2500);
    }
    
    // 인트로 후 틱 시작
    setTimeout(() => {
      this.tickInterval = setInterval(() => this.tick(), 1000);
    }, 3000);
    
    this.updateHUD();
    this.inputEl.focus();
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
    
    // O2 drain (초반 완화 보너스 체크)
    if (!(this.state.earlyDrainRelief && this.state.time < 30)) {
      resources.o2 = Math.max(0, resources.o2 - 1);
    }
    
    // Noise decay
    resources.noise = Math.max(0, resources.noise - 1);
    
    // Enemy movement
    this.state.time++;
    if (this.state.time % 3 === 0 && resources.noise > 30) {
      enemy.distance = Math.max(0, enemy.distance - 1);
    }
    
    // 위험 탈출 체크 (적 거리 1에서 생존)
    if (enemy.distance === 1) {
      this.meta.onDangerEscape();
    }
    
    // 랜덤 이벤트
    this.events.tick();
    
    // Update visuals
    this.updateHUD();
    this.updateCRT();
    
    // Check death
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
      'help', 'status', 'scan', 'cd', 'ls', 'map', 'objectives',
      'hide', 'repair', 'login', 'su', 'lock', 'unlock', 'escape',
      'shop', 'stats', 'buy', 'use'
    ];
    const match = commands.find(cmd => cmd.startsWith(input));
    if (match) {
      this.inputEl.value = match;
    }
  }
  
  executeCommand(command) {
    this.print(`> ${command}`);
    
    if (this.events.checkGlitchFail()) {
      return;
    }
    
    const parts = command.toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    // 메타 커맨드는 소음 없음
    const metaCmds = ['shop', 'stats', 'buy'];
    if (!metaCmds.includes(cmd)) {
      this.state.resources.noise = Math.min(100, this.state.resources.noise + 2);
    }
    
    let success = true;
    
    switch (cmd) {
      case 'help':
        this.cmdHelp();
        break;
      case 'status':
        this.cmdStatus();
        break;
      case 'scan':
        success = this.cmdScan();
        break;
      case 'cd':
        success = this.cmdCd(args[0]);
        break;
      case 'ls':
        this.cmdLs();
        break;
      case 'map':
        this.cmdMap();
        break;
      case 'objectives':
        this.cmdObjectives();
        break;
      case 'hide':
        this.cmdHide();
        break;
      case 'repair':
        success = this.cmdRepair();
        break;
      case 'login':
        success = this.cmdLogin(args[0]);
        break;
      case 'su':
        success = this.cmdSu();
        break;
      case 'escape':
        success = this.cmdEscape();
        break;
      case 'lock':
        if (args[0] === 'door') this.cmdLockDoor();
        else { this.print(MSG.CMD_NOT_FOUND(cmd), 'error'); success = false; }
        break;
      case 'unlock':
        if (args[0] === 'door') this.cmdUnlockDoor();
        else { this.print(MSG.CMD_NOT_FOUND(cmd), 'error'); success = false; }
        break;
      case 'shop':
        this.cmdShop();
        break;
      case 'stats':
        this.cmdStats();
        break;
      case 'buy':
        success = this.cmdBuy(parseInt(args[0]));
        break;
      case 'use':
        success = this.cmdUse(args[0]);
        break;
      default:
        this.print(MSG.CMD_NOT_FOUND(cmd), 'error');
        this.triggerError();
        success = false;
    }
    
    if (success) {
      this.tutorial.onCommand(command.toLowerCase());
    } else {
      this.tutorial.onError();
    }
    
    this.updateHUD();
    this.updateCRT();
  }
  
  // ==================== 기본 커맨드 ====================
  
  cmdHelp() {
    this.print(MSG.HELP_HEADER, 'system');
    this.print('');
    for (const [cmd, desc] of Object.entries(MSG.HELP_CMDS)) {
      this.print(`  ${cmd.padEnd(12)} - ${desc}`);
    }
  }
  
  cmdStatus() {
    const { resources, location, permission } = this.state;
    const roomKr = MSG.ROOMS[location] || location;
    const permKr = MSG.PERMISSION[permission] || permission;
    
    this.print(MSG.STATUS_HEADER, 'system');
    this.print(`${MSG.STATUS_LOCATION}: ${roomKr} (${location})`);
    this.print(`${MSG.STATUS_PERMISSION}: ${permKr} (${permission})`);
    this.print('');
    this.print(`HP: ${resources.hp}  O2: ${resources.o2}%`);
    this.print(`전력: ${resources.power}  소음: ${resources.noise}`);
    this.print('');
    this.print(`목표 진행: ${this.objectives.getCompletedCount()}/2`, 'system');
    this.print(`보유 DATA: ${this.meta.saved.totalData}`, 'system');
    
    this.events.showStatus();
  }
  
  cmdScan() {
    if (this.events.isBlackout()) {
      this.print('[오류] 정전으로 스캔 시스템이 비활성화되었습니다.', 'error');
      this.triggerError();
      return false;
    }
    
    this.state.resources.noise = Math.min(100, this.state.resources.noise + 2);
    this.print(MSG.SCAN_START, 'system');
    
    const dist = this.state.enemy.distance;
    let msg, type;
    
    if (dist >= 5) { msg = MSG.SCAN_ENEMY_FAR; type = 'success'; }
    else if (dist >= 3) { msg = MSG.SCAN_ENEMY_APPROACHING; type = 'warning'; }
    else if (dist >= 1) { msg = MSG.SCAN_ENEMY_NEAR; type = 'error'; }
    else { msg = MSG.SCAN_ENEMY_CRITICAL; type = 'error'; }
    
    this.print(msg, type);
    this.print(`(거리: ${dist})`, 'system');
    
    const leakRoom = this.events.getLeakRoom();
    if (leakRoom) {
      this.print(`⚠ 산소 누출 감지: ${MSG.ROOMS[leakRoom]}`, 'warning');
    }
    
    return true;
  }
  
  cmdCd(room) {
    if (!room) {
      this.print(MSG.MOVE_USAGE, 'error');
      return false;
    }
    
    const rooms = ['hub', 'reactor', 'medbay', 'storage', 'security', 'airlock'];
    if (rooms.includes(room)) {
      this.state.location = room;
      this.state.resources.noise = Math.min(100, this.state.resources.noise + 1);
      const roomKr = MSG.ROOMS[room] || room;
      this.print(MSG.MOVE_SUCCESS(room, roomKr), 'success');
      
      const obj = this.objectives.getObjectiveForRoom(room);
      if (obj) this.print(`[!] 이 방에서 수행 가능: ${obj.name}`, 'warning');
      
      if (this.events.getLeakRoom() === room) {
        this.print('⚠ 경고: 이 방에서 산소가 누출되고 있습니다!', 'error');
      }
      
      return true;
    } else {
      this.print(MSG.MOVE_UNKNOWN(room), 'error');
      this.triggerError();
      return false;
    }
  }
  
  cmdLs() {
    const { location } = this.state;
    const roomKr = MSG.ROOMS[location] || location;
    
    this.print(MSG.LS_HEADER, 'system');
    this.print(`현재 위치: ${roomKr}`, 'system');
    this.print('');
    
    const items = {
      hub: ['터미널', '비상 지도'],
      reactor: ['원자로 제어판', '냉각 시스템', '공구함'],
      medbay: ['의료 키트', '산소 캔', '진단 장비'],
      storage: ['부품 상자', '배터리', '예비 부품'],
      security: ['보안 콘솔', '키카드 리더기', '모니터'],
      airlock: ['탈출 해치', '우주복', '비상 버튼'],
    };
    
    const roomItems = items[location] || [];
    if (roomItems.length > 0) {
      this.print(MSG.LS_ITEMS);
      roomItems.forEach(item => this.print(`  - ${item}`));
    } else {
      this.print(MSG.LS_NOTHING);
    }
    
    const obj = this.objectives.getObjectiveForRoom(location);
    if (obj) {
      this.print('');
      this.print(`[목표] ${obj.name} - repair 명령으로 수행`, 'warning');
    }
  }
  
  cmdMap() {
    this.print(MSG.MAP_HEADER, 'system');
    this.print('');
    this.print('    [reactor]---[hub]---[medbay]');
    this.print('                  |');
    this.print('              [storage]');
    this.print('                  |');
    this.print('             [security]');
    this.print('                  |');
    this.print('             [airlock]');
    this.print('');
    this.print(MSG.MAP_CURRENT(MSG.ROOMS[this.state.location]), 'success');
  }
  
  cmdObjectives() { this.objectives.showStatus(); }
  
  cmdHide() {
    this.state.resources.noise = 0;
    this.state.enemy.distance = Math.min(5, this.state.enemy.distance + 2);
    this.print(MSG.HIDE_SUCCESS, 'success');
    this.state.time += 2;
  }
  
  // ==================== 문 커맨드 ====================
  
  cmdLockDoor() {
    const { resources, doorLocked } = this.state;
    if (doorLocked) { this.print(MSG.DOOR_ALREADY_LOCKED, 'warning'); return; }
    if (resources.power < 5) { this.print(MSG.DOOR_NO_POWER, 'error'); return; }
    resources.power -= 5;
    this.state.doorLocked = true;
    this.print(MSG.DOOR_LOCKED, 'success');
  }
  
  cmdUnlockDoor() {
    if (!this.state.doorLocked) { this.print(MSG.DOOR_ALREADY_UNLOCKED, 'warning'); return; }
    this.state.doorLocked = false;
    this.print(MSG.DOOR_UNLOCKED, 'success');
  }
  
  // ==================== 권한 커맨드 ====================
  
  cmdLogin(level) {
    if (!level) { this.print(MSG.LOGIN_USAGE, 'error'); return false; }
    if (level !== 'engineer') { this.print(MSG.LOGIN_FAIL, 'error'); return false; }
    if (this.state.location !== 'security') { this.print(MSG.LOGIN_NEED_SECURITY, 'error'); return false; }
    if (this.state.permission === 'engineer' || this.state.permission === 'admin') {
      this.print(MSG.LOGIN_ALREADY(MSG.PERMISSION[this.state.permission]), 'warning');
      return false;
    }
    
    this.state.permission = 'engineer';
    this.print(MSG.LOGIN_SUCCESS(MSG.PERMISSION.engineer), 'success');
    this.print('');
    this.print('이제 repair 명령을 사용할 수 있습니다!', 'system');
    
    this.terminalEl.classList.add('success-flash');
    setTimeout(() => this.terminalEl.classList.remove('success-flash'), 300);
    
    return true;
  }
  
  cmdSu() {
    if (this.state.permission === 'admin') { this.print(MSG.SU_ALREADY, 'warning'); return false; }
    
    // 임시 su 토큰 사용
    if (this.state.hasTempSuToken && this.state.permission === 'engineer') {
      this.state.hasTempSuToken = false;
      this.state.permission = 'admin';
      this.print('임시 SU 토큰 사용!', 'warning');
      this.print(MSG.SU_SUCCESS, 'success');
      this.updateHUD();
      return true;
    }
    
    if (this.state.permission !== 'engineer') { this.print(MSG.SU_NEED_ENGINEER, 'error'); return false; }
    if (this.state.location !== 'security') { this.print(MSG.SU_NEED_SECURITY, 'error'); return false; }
    
    this.typingChallenge.start('security',
      () => {
        this.state.permission = 'admin';
        this.print(MSG.SU_SUCCESS, 'success');
        this.updateHUD();
        this.terminalEl.classList.add('success-flash');
        this.crt.glitch(300);
        setTimeout(() => this.terminalEl.classList.remove('success-flash'), 300);
      },
      () => this.print(MSG.SU_FAIL, 'error')
    );
    
    return true;
  }
  
  // ==================== 목표/수리 ====================
  
  cmdRepair() {
    if (this.state.permission === 'guest') {
      this.print(MSG.PERMISSION_DENIED, 'error');
      this.print('');
      this.print(MSG.HINTS.NEED_ENGINEER, 'system');
      return false;
    }
    
    const obj = this.objectives.getObjectiveForRoom(this.state.location);
    if (!obj) { this.print(MSG.REPAIR_NO_OBJECTIVE, 'error'); return false; }
    if (obj.completed) { this.print(MSG.REPAIR_ALREADY_DONE, 'warning'); return false; }
    
    this.print(MSG.REPAIR_START, 'system');
    
    this.typingChallenge.start(obj.id,
      () => {
        obj.completed = true;
        this.meta.onObjectiveComplete();
        this.print('');
        this.print(MSG.OBJECTIVE_COMPLETE(obj.name), 'success');
        this.print('');
        this.showStamp(`${obj.nameEn}: ONLINE`);
        
        if (this.objectives.getCompletedCount() >= 2) {
          this.print('[시스템] 탈출 조건 충족! airlock 에서 escape 명령을 실행하세요.', 'warning');
        }
      },
      () => this.print('수리에 실패했습니다. 다시 시도하세요.', 'error')
    );
    
    return true;
  }
  
  // ==================== 탈출 ====================
  
  cmdEscape() {
    if (this.state.location !== 'airlock') {
      this.print(MSG.ESCAPE_FAIL_LOCATION, 'error');
      return false;
    }
    
    const completed = this.objectives.getCompletedCount();
    if (completed < 2) {
      this.print(MSG.ESCAPE_FAIL_OBJECTIVES(completed, 2), 'error');
      return false;
    }
    
    this.victory();
    return true;
  }
  
  // ==================== 메타 커맨드 ====================
  
  cmdShop() {
    this.meta.showShop();
  }
  
  cmdStats() {
    this.meta.showStats();
  }
  
  cmdBuy(index) {
    if (isNaN(index)) {
      this.print(MSG.SHOP_BUY_USAGE, 'error');
      return false;
    }
    return this.meta.buyItem(index);
  }
  
  cmdUse(item) {
    if (item === 'o2' && this.state.hasEmergencyO2) {
      this.state.hasEmergencyO2 = false;
      this.state.resources.o2 = Math.min(100, this.state.resources.o2 + 30);
      this.print('응급 O2 캔 사용! O2 +30', 'success');
      return true;
    }
    this.print('사용할 수 있는 아이템이 없습니다.', 'error');
    return false;
  }
  
  // ==================== 게임 종료 ====================
  
  victory() {
    this.pause();
    this.tutorial.destroy();
    
    this.print('');
    this.print(MSG.ESCAPE_SUCCESS, 'success');
    this.print(MSG.ESCAPE_VICTORY, 'success');
    this.print('');
    
    const mins = Math.floor(this.state.time / 60);
    const secs = this.state.time % 60;
    this.print(`클리어 시간: ${mins}분 ${secs}초`, 'system');
    this.print(`남은 산소: ${this.state.resources.o2}%`, 'system');
    this.print(`완료한 목표: ${this.objectives.getCompletedCount()}/3`, 'system');
    this.print('');
    
    // DATA 계산
    const reward = this.meta.calculateRunReward(true, this.state.time);
    this.print(MSG.RUN_REWARD_HEADER, 'system');
    reward.breakdown.forEach(line => this.print(`  ${line}`));
    this.print('');
    this.print(MSG.RUN_REWARD_TOTAL(reward.data), 'success');
    this.print(MSG.RUN_REWARD_BANK(reward.total), 'system');
    this.print('');
    this.print('새로고침하여 다시 도전하세요. shop 으로 해금을 확인하세요!', 'system');
    
    this.showStamp('ESCAPED');
  }
  
  gameOver() {
    this.pause();
    this.tutorial.destroy();
    
    this.print('', 'system');
    this.print(MSG.GAME_OVER, 'error');
    
    if (this.state.resources.o2 <= 0) this.print(MSG.DEATH_O2, 'error');
    else if (this.state.resources.hp <= 0) this.print(MSG.DEATH_HP, 'error');
    else if (this.state.enemy.distance === 0) this.print(MSG.DEATH_ENEMY, 'error');
    
    // DATA 계산 (실패)
    const reward = this.meta.calculateRunReward(false, this.state.time);
    this.print('');
    this.print(MSG.RUN_REWARD_HEADER, 'system');
    reward.breakdown.forEach(line => this.print(`  ${line}`));
    this.print('');
    this.print(MSG.RUN_REWARD_TOTAL(reward.data), 'warning');
    this.print(MSG.RUN_REWARD_BANK(reward.total), 'system');
    this.print('');
    this.print(MSG.RETRY, 'system');
  }
  
  // ==================== UI ====================
  
  print(text, type = '') {
    const line = document.createElement('div');
    line.className = `line ${type}`;
    line.textContent = text;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  showStamp(text) {
    const stamp = document.createElement('div');
    stamp.className = 'line stamp';
    stamp.textContent = text;
    this.outputEl.appendChild(stamp);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
    this.terminalEl.classList.add('success-flash');
    setTimeout(() => this.terminalEl.classList.remove('success-flash'), 600);
  }
  
  updateHUD() {
    const { resources, time } = this.state;
    
    this.hudEl.querySelector('[data-value="hp"]').textContent = resources.hp;
    this.hudEl.querySelector('[data-value="o2"]').textContent = resources.o2;
    this.hudEl.querySelector('[data-value="power"]').textContent = resources.power;
    this.hudEl.querySelector('[data-value="noise"]').textContent = resources.noise;
    
    const mins = Math.floor(time / 60).toString().padStart(2, '0');
    const secs = (time % 60).toString().padStart(2, '0');
    this.hudEl.querySelector('[data-value="time"]').textContent = `${mins}:${secs}`;
    
    this.setBar('hp', resources.hp, 100);
    this.setBar('o2', resources.o2, 100);
    this.setBar('power', resources.power, 100);
    this.setBar('noise', resources.noise, 100);
    
    this.hudEl.querySelector('[data-resource="o2"]').dataset.low = resources.o2 < 20;
    this.hudEl.querySelector('[data-resource="hp"]').dataset.low = resources.hp < 20;
    
    const prompts = { guest: 'guest@station:~$', engineer: 'engineer@station:~>', admin: 'root@station:~#' };
    this.promptEl.textContent = prompts[this.state.permission];
    this.promptEl.className = `prompt ${this.state.permission}`;
  }
  
  setBar(resource, value, max) {
    const bar = this.hudEl.querySelector(`[data-resource="${resource}"]`);
    if (bar) bar.style.setProperty('--bar-fill', `${(value / max) * 100}%`);
  }
  
  updateCRT() {
    this.crt.updateFromGameState({
      noise: this.state.resources.noise,
      enemyDistance: this.state.enemy.distance,
    });
  }
  
  triggerError() {
    this.terminalEl.classList.add('error-flash');
    this.crt.glitch(200);
    setTimeout(() => this.terminalEl.classList.remove('error-flash'), 200);
  }
}
