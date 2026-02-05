/**
 * CRT Effect - Canvas overlay for retro terminal visuals
 * Handles: scanlines, noise, pulse, glitch
 */

export class CRTEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.lastTime = 0;
    
    // Effect intensities (can be updated by game state)
    this.intensity = {
      scanline: 0.08,
      noise: 0.04,
      pulse: 0,
      pulseFreq: 0,
    };
    
    // Resize handler
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  /**
   * Update effect intensities based on game state
   * @param {Object} state - { noise, enemyDistance, isError }
   */
  updateFromGameState(state) {
    const { noise = 0, enemyDistance = 5, isError = false } = state;
    
    // Base values
    let scanline = 0.08;
    let noiseLevel = 0.04;
    let pulse = 0;
    let pulseFreq = 0;
    
    // Noise level scaling
    if (noise >= 80) {
      scanline = 0.12;
      noiseLevel = 0.08;
      pulse = 0.03;
      pulseFreq = 1.2;
    } else if (noise >= 50) {
      scanline = 0.10;
      noiseLevel = 0.06;
      pulse = 0.02;
      pulseFreq = 0.8;
    }
    
    // Enemy distance scaling (overrides if more intense)
    if (enemyDistance === 0) {
      scanline = Math.max(scanline, 0.14);
      noiseLevel = Math.max(noiseLevel, 0.10);
      pulse = 0.05;
      pulseFreq = 2.0;
    } else if (enemyDistance <= 2) {
      scanline = Math.max(scanline, 0.12);
      noiseLevel = Math.max(noiseLevel, 0.08);
      pulse = Math.max(pulse, 0.04);
      pulseFreq = Math.max(pulseFreq, 1.6);
    } else if (enemyDistance <= 4) {
      scanline = Math.max(scanline, 0.10);
      noiseLevel = Math.max(noiseLevel, 0.06);
      pulse = Math.max(pulse, 0.02);
      pulseFreq = Math.max(pulseFreq, 1.0);
    }
    
    // Error flash (temporary boost)
    if (isError) {
      scanline += 0.03;
      noiseLevel += 0.06;
    }
    
    this.intensity = { scanline, noise: noiseLevel, pulse, pulseFreq };
  }
  
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }
  
  pause() {
    this.running = false;
  }
  
  resume() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.loop();
    }
  }
  
  loop() {
    if (!this.running) return;
    
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    this.render(now);
    
    requestAnimationFrame(() => this.loop());
  }
  
  render(time) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const { scanline, noise, pulse, pulseFreq } = this.intensity;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Pulse brightness modifier
    let brightness = 1;
    if (pulse > 0 && pulseFreq > 0) {
      brightness = 1 + pulse * Math.sin(time * 0.001 * Math.PI * 2 * pulseFreq);
    }
    
    // Draw scanlines
    this.drawScanlines(ctx, width, height, scanline * brightness);
    
    // Draw noise
    this.drawNoise(ctx, width, height, noise * brightness);
  }
  
  drawScanlines(ctx, width, height, alpha) {
    if (alpha <= 0) return;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    const lineHeight = 2;
    
    for (let y = 0; y < height; y += lineHeight * 2) {
      ctx.fillRect(0, y, width, lineHeight);
    }
  }
  
  drawNoise(ctx, width, height, alpha) {
    if (alpha <= 0) return;
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const noiseAlpha = Math.floor(alpha * 255);
    
    // Sparse noise for performance
    const density = 0.03;
    const totalPixels = width * height;
    const noisePixels = Math.floor(totalPixels * density);
    
    for (let i = 0; i < noisePixels; i++) {
      const idx = Math.floor(Math.random() * totalPixels) * 4;
      const brightness = Math.random() > 0.5 ? 255 : 0;
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
      data[idx + 3] = noiseAlpha;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Trigger a short glitch effect
   * @param {number} duration - Duration in ms
   */
  glitch(duration = 200) {
    const originalIntensity = { ...this.intensity };
    this.intensity.scanline += 0.05;
    this.intensity.noise += 0.08;
    
    setTimeout(() => {
      this.intensity = originalIntensity;
    }, duration);
  }
}
