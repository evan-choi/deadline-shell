/**
 * Game - Core game logic for DEADLINE SHELL
 * 커맨드는 영어, 설명은 한글
 */

import { MSG } from './messages.js';
import { Tutorial } from './Tutorial.js';

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
      permission: 'guest', // guest, engineer, admin
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
    };
    
    // Tick interval (1 second)
    this.tickInterval = null;
    
    // Command history
    this.history = [];
    this.historyIndex = -1;
    
    // Tutorial system
    this.tutorial = new Tutorial(this);
    
    // Bind input handler
    this.inputEl.addEventListener('keydown', (e) => this.handleInput(e));
  }
  
  start() {
    this.state.running = true;
    this.state.paused = false;
    
    // 인트로 출력
    this.tutorial.showIntro();
    
    // 인트로 후 틱 시작 (3초 후)
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
    
    // O2 drain
    resources.o2 = Math.max(0, resources.o2 - 1);
    
    // Noise decay
    resources.noise = Math.max(0, resources.noise - 1);
    
    // Enemy movement (every 3 ticks based on noise)
    this.state.time++;
    if (this.state.time % 3 === 0 && resources.noise > 30) {
      enemy.distance = Math.max(0, enemy.distance - 1);
    }
    
    // Update visuals
    this.updateHUD();
    this.updateCRT();
    
    // Check death conditions
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
        this.executeCommand(command);
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
    const commands = ['help', 'status', 'scan', 'cd', 'ls', 'map', 'logs', 'hide', 'repair', 'lock', 'unlock'];
    const match = commands.find(cmd => cmd.startsWith(input));
    if (match) {
      this.inputEl.value = match;
    }
  }
  
  executeCommand(command) {
    this.print(`> ${command}`);
    
    const parts = command.toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    // 복합 커맨드 체크 (lock door, unlock door)
    const fullCmd = parts.slice(0, 2).join(' ');
    
    // Add noise for any command
    this.state.resources.noise = Math.min(100, this.state.resources.noise + 2);
    
    let success = true;
    
    switch (cmd) {
      case 'help':
        this.cmdHelp();
        break;
      case 'status':
        this.cmdStatus();
        break;
      case 'scan':
        this.cmdScan();
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
      case 'hide':
        this.cmdHide();
        break;
      case 'lock':
        if (args[0] === 'door') {
          this.cmdLockDoor();
        } else {
          this.print(MSG.CMD_NOT_FOUND(cmd), 'error');
          success = false;
        }
        break;
      case 'unlock':
        if (args[0] === 'door') {
          this.cmdUnlockDoor();
        } else {
          this.print(MSG.CMD_NOT_FOUND(cmd), 'error');
          success = false;
        }
        break;
      default:
        this.print(MSG.CMD_NOT_FOUND(cmd), 'error');
        this.triggerError();
        success = false;
    }
    
    // Tutorial 업데이트
    if (success) {
      this.tutorial.onCommand(command.toLowerCase());
    } else {
      this.tutorial.onError();
    }
    
    this.updateHUD();
    this.updateCRT();
  }
  
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
  }
  
  cmdScan() {
    this.state.resources.noise = Math.min(100, this.state.resources.noise + 2);
    this.print(MSG.SCAN_START, 'system');
    
    const dist = this.state.enemy.distance;
    let msg, type;
    
    if (dist >= 5) {
      msg = MSG.SCAN_ENEMY_FAR;
      type = 'success';
    } else if (dist >= 3) {
      msg = MSG.SCAN_ENEMY_APPROACHING;
      type = 'warning';
    } else if (dist >= 1) {
      msg = MSG.SCAN_ENEMY_NEAR;
      type = 'error';
    } else {
      msg = MSG.SCAN_ENEMY_CRITICAL;
      type = 'error';
    }
    
    this.print(msg, type);
    this.print(`(거리: ${dist})`, 'system');
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
    
    // 방별 아이템 (간단히)
    const items = {
      hub: ['터미널', '비상 지도'],
      reactor: ['원자로 제어판', '공구함'],
      medbay: ['의료 키트', '산소 캔'],
      storage: ['부품 상자', '배터리'],
      security: ['보안 콘솔', '키카드'],
      airlock: ['탈출 해치', '우주복'],
    };
    
    const roomItems = items[location] || [];
    if (roomItems.length > 0) {
      this.print(MSG.LS_ITEMS);
      roomItems.forEach(item => this.print(`  - ${item}`));
    } else {
      this.print(MSG.LS_NOTHING);
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
    
    const roomKr = MSG.ROOMS[this.state.location] || this.state.location;
    this.print(MSG.MAP_CURRENT(`${roomKr}`), 'success');
  }
  
  cmdHide() {
    const { enemy, resources } = this.state;
    
    // 숨기 성공: 소음 초기화, 적 거리 +2
    resources.noise = 0;
    enemy.distance = Math.min(5, enemy.distance + 2);
    
    this.print(MSG.HIDE_SUCCESS, 'success');
    
    // 숨는 동안 시간이 지남
    this.state.time += 2;
  }
  
  cmdLockDoor() {
    const { resources, doorLocked } = this.state;
    
    if (doorLocked) {
      this.print(MSG.DOOR_ALREADY_LOCKED, 'warning');
      return;
    }
    
    if (resources.power < 5) {
      this.print(MSG.DOOR_NO_POWER, 'error');
      return;
    }
    
    resources.power -= 5;
    this.state.doorLocked = true;
    this.print(MSG.DOOR_LOCKED, 'success');
  }
  
  cmdUnlockDoor() {
    if (!this.state.doorLocked) {
      this.print(MSG.DOOR_ALREADY_UNLOCKED, 'warning');
      return;
    }
    
    this.state.doorLocked = false;
    this.print(MSG.DOOR_UNLOCKED, 'success');
  }
  
  print(text, type = '') {
    const line = document.createElement('div');
    line.className = `line ${type}`;
    line.textContent = text;
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }
  
  updateHUD() {
    const { resources, time } = this.state;
    
    // Update values
    this.hudEl.querySelector('[data-value="hp"]').textContent = resources.hp;
    this.hudEl.querySelector('[data-value="o2"]').textContent = resources.o2;
    this.hudEl.querySelector('[data-value="power"]').textContent = resources.power;
    this.hudEl.querySelector('[data-value="noise"]').textContent = resources.noise;
    
    const mins = Math.floor(time / 60).toString().padStart(2, '0');
    const secs = (time % 60).toString().padStart(2, '0');
    this.hudEl.querySelector('[data-value="time"]').textContent = `${mins}:${secs}`;
    
    // Update bars
    this.setBar('hp', resources.hp, 100);
    this.setBar('o2', resources.o2, 100);
    this.setBar('power', resources.power, 100);
    this.setBar('noise', resources.noise, 100);
    
    // Low resource warning
    this.hudEl.querySelector('[data-resource="o2"]').dataset.low = resources.o2 < 20;
    this.hudEl.querySelector('[data-resource="hp"]').dataset.low = resources.hp < 20;
    
    // Update prompt
    const prompts = {
      guest: 'guest@station:~$',
      engineer: 'engineer@station:~>',
      admin: 'root@station:~#',
    };
    this.promptEl.textContent = prompts[this.state.permission];
    this.promptEl.className = `prompt ${this.state.permission}`;
  }
  
  setBar(resource, value, max) {
    const bar = this.hudEl.querySelector(`[data-resource="${resource}"]`);
    if (bar) {
      bar.style.setProperty('--bar-fill', `${(value / max) * 100}%`);
    }
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
    setTimeout(() => {
      this.terminalEl.classList.remove('error-flash');
    }, 200);
  }
  
  gameOver() {
    this.pause();
    this.tutorial.destroy();
    
    this.print('', 'system');
    this.print(MSG.GAME_OVER, 'error');
    
    if (this.state.resources.o2 <= 0) {
      this.print(MSG.DEATH_O2, 'error');
    } else if (this.state.resources.hp <= 0) {
      this.print(MSG.DEATH_HP, 'error');
    } else if (this.state.enemy.distance === 0) {
      this.print(MSG.DEATH_ENEMY, 'error');
    }
    
    this.print('', 'system');
    this.print(MSG.RETRY, 'system');
  }
}
