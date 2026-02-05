/**
 * Game - Core game logic for DEADLINE SHELL
 */

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
    };
    
    // Tick interval (1 second)
    this.tickInterval = null;
    
    // Command history
    this.history = [];
    this.historyIndex = -1;
    
    // Bind input handler
    this.inputEl.addEventListener('keydown', (e) => this.handleInput(e));
  }
  
  start() {
    this.state.running = true;
    this.state.paused = false;
    this.tickInterval = setInterval(() => this.tick(), 1000);
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
    }
  }
  
  executeCommand(command) {
    this.print(`> ${command}`);
    
    const [cmd, ...args] = command.toLowerCase().split(' ');
    
    // Add noise for any command
    this.state.resources.noise = Math.min(100, this.state.resources.noise + 2);
    
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
        this.cmdCd(args[0]);
        break;
      default:
        this.print(`Command not found: ${cmd}`, 'error');
        this.triggerError();
    }
    
    this.updateHUD();
    this.updateCRT();
  }
  
  cmdHelp() {
    this.print('Available commands:', 'system');
    this.print('  help     - Show this help');
    this.print('  status   - Show current status');
    this.print('  scan     - Scan surroundings');
    this.print('  cd <room> - Move to room');
  }
  
  cmdStatus() {
    const { resources, location, permission } = this.state;
    this.print(`Location: ${location}`);
    this.print(`Permission: ${permission}`);
    this.print(`HP: ${resources.hp}  O2: ${resources.o2}%`);
    this.print(`Power: ${resources.power}  Noise: ${resources.noise}`);
  }
  
  cmdScan() {
    this.state.resources.noise = Math.min(100, this.state.resources.noise + 2);
    this.print('Scanning...', 'system');
    this.print(`Enemy distance: ${this.state.enemy.distance}`, 
      this.state.enemy.distance <= 2 ? 'warning' : 'system');
  }
  
  cmdCd(room) {
    if (!room) {
      this.print('Usage: cd <room>', 'error');
      return;
    }
    
    const rooms = ['hub', 'reactor', 'medbay', 'storage', 'security', 'airlock'];
    if (rooms.includes(room)) {
      this.state.location = room;
      this.state.resources.noise = Math.min(100, this.state.resources.noise + 1);
      this.print(`Moved to ${room}`, 'success');
    } else {
      this.print(`Unknown room: ${room}`, 'error');
      this.triggerError();
    }
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
    this.print('', 'system');
    this.print('========== GAME OVER ==========', 'error');
    
    if (this.state.resources.o2 <= 0) {
      this.print('You suffocated.', 'error');
    } else if (this.state.resources.hp <= 0) {
      this.print('You died.', 'error');
    } else if (this.state.enemy.distance === 0) {
      this.print('The Stalker found you.', 'error');
    }
    
    this.print('', 'system');
    this.print('Refresh to try again.', 'system');
  }
}
