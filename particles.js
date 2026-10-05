/* ==========================================================================
   SUBWAY SURFERS PARTICLES & VISUAL EFFECTS (DAYLIGHT PALETTE)
   Colors: #E31902, #F7BE76, #FFED6D, #C6FEFE, #6AEEFD, #354093
   ========================================================================== */

class ParticleCanvas {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.init();
  }

  init() {
    this.canvas.id = 'bgParticleCanvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    document.body.appendChild(this.canvas);

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Ambient floating daytime sparkles
    const colors = ['#FFED6D', '#E31902', '#6AEEFD', '#F7BE76', '#354093'];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.7,
        vy: -Math.random() * 1.1 - 0.3,
        alpha: Math.random() * 0.5 + 0.2,
        isSparkle: Math.random() > 0.4
      });
    }

    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();

      if (p.isSparkle) {
        this.drawStar(p.x, p.y, p.radius * 2, p.radius * 0.8);
      } else {
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }

  drawStar(cx, cy, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / 4;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < 4; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // --- TRIGGER SPRAY SPLASH AT COORDINATES ---
  spraySplash(x, y, count = 20) {
    const colors = ['#E31902', '#FFED6D', '#6AEEFD', '#F7BE76', '#354093'];
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'spray-particle';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 18 + 6;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 80 + 30;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.background = color;
      dot.style.border = '2px solid #354093';
      dot.style.boxShadow = `0 2px 6px ${color}`;
      dot.style.setProperty('--tx', `${tx}px`);
      dot.style.setProperty('--ty', `${ty}px`);

      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 1500);
    }
  }

  // --- TRIGGER CONFETTI SHOWER ---
  burstConfetti() {
    const colors = ['#E31902', '#FFED6D', '#6AEEFD', '#F7BE76', '#354093', '#2ed573'];
    const count = 75;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 350 + 100;
      const cx = Math.cos(angle) * velocity;
      const cy = Math.sin(angle) * velocity + 150;

      confetti.style.left = `${centerX}px`;
      confetti.style.top = `${centerY}px`;
      confetti.style.background = color;
      confetti.style.border = '1px solid #354093';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
      confetti.style.setProperty('--cx', `${cx}px`);
      confetti.style.setProperty('--cy', `${cy}px`);

      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 2600);
    }
  }
}

// Global instance
window.subwayParticles = new ParticleCanvas();
