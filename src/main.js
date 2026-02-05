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

  // Get input elements
  const inputEl = document.getElementById('command-input');
  const mirrorEl = document.querySelector('.input-mirror');

  // Initialize game
  const game = new Game({
    outputEl: document.getElementById('output'),
    inputEl: inputEl,
    promptEl: document.querySelector('.prompt'),
    hudEl: document.getElementById('hud'),
    terminalEl: document.getElementById('terminal'),
    crt,
  });

  game.start();

  // Mirror input text for cursor positioning
  if (mirrorEl) {
    inputEl.addEventListener('input', () => {
      mirrorEl.textContent = inputEl.value;
    });
    
    // Also update on keyup for edge cases
    inputEl.addEventListener('keyup', () => {
      mirrorEl.textContent = inputEl.value;
    });
    
    // Clear mirror when input is cleared
    inputEl.addEventListener('change', () => {
      mirrorEl.textContent = inputEl.value;
    });
  }

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
    inputEl.focus();
  });
});
