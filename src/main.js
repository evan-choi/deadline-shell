/**
 * DEADLINE SHELL - Main Entry Point
 * Terminal Survival / Typing Action / Puzzle
 */

import { CRTEffect } from './effects/crt.js';
import { Game } from './game/Game.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize CRT overlay effect
  const crtCanvas = document.getElementById('crt-overlay');
  const crt = new CRTEffect(crtCanvas);
  crt.start();

  // Initialize game
  const game = new Game({
    outputEl: document.getElementById('output'),
    inputEl: document.getElementById('command-input'),
    promptEl: document.querySelector('.prompt'),
    hudEl: document.getElementById('hud'),
    terminalEl: document.getElementById('terminal'),
    crt,
  });

  game.start();

  // Handle tab visibility (pause when hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.pause();
      crt.pause();
    } else {
      game.resume();
      crt.resume();
    }
  });

  // Focus input on click anywhere
  document.addEventListener('click', () => {
    document.getElementById('command-input').focus();
  });
});
