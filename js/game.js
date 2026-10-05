/* ==========================================================================
   SUBWAY SURFERS 3-LANE ENDLESS RUNNER (BRIGHT TROPICAL DAYLIGHT EDITION)
   Matches the bright sunny daytime Bali/Tropical gameplay aesthetic
   Colors: #E31902, #F7BE76, #FFED6D, #C6FEFE, #6AEEFD, #354093
   ========================================================================== */

class SubwayRunnerGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = this.canvas.width = 760;
    this.height = this.canvas.height = 460;

    // Game states
    this.isRunning = false;
    this.isGameOver = false;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speed = 7;
    this.animationId = null;

    // Lane positions (-1: Left, 0: Center, 1: Right)
    this.lanes = [-1, 0, 1];
    this.laneXPositions = [this.width * 0.28, this.width * 0.5, this.width * 0.72];
    
    // Player object
    this.player = {
      lane: 0,
      currentX: this.width * 0.5,
      targetX: this.width * 0.5,
      y: this.height - 85,
      baseY: this.height - 85,
      width: 44,
      height: 64,
      vy: 0,
      isJumping: false,
      isRolling: false,
      rollTimer: 0,
      hasHoverboard: true,
      powerupTimer: 100
    };

    // Obstacles and Items
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
    this.itemTimer = 0;
    this.cloudOffset = 0;
    this.unlockedMilestones = new Set();

    // Vanishing Point
    this.vanishingY = 135;
    this.vanishingX = this.width / 2;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.moveLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.roll();
      }
    });

    // Touch swipe handling
    let touchStartX = 0;
    let touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isRunning) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) this.moveLane(1);
        else if (dx < -30) this.moveLane(-1);
      } else {
        if (dy < -30) this.jump();
        else if (dy > 30) this.roll();
      }
    }, { passive: true });
  }

  moveLane(dir) {
    const newLane = this.player.lane + dir;
    if (newLane >= -1 && newLane <= 1) {
      this.player.lane = newLane;
      this.player.targetX = this.laneXPositions[newLane + 1];
      if (window.subwayAudio) window.subwayAudio.playClick();
    }
  }

  jump() {
    if (!this.player.isJumping) {
      this.player.isJumping = true;
      this.player.vy = -14;
      if (window.subwayAudio) window.subwayAudio.playJump();
    }
  }

  roll() {
    if (!this.player.isRolling) {
      this.player.isRolling = true;
      this.player.rollTimer = 25;
      if (this.player.isJumping) {
        this.player.vy = 12; // Fast dive
      }
    }
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.isGameOver = false;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset() {
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speed = 7;
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
    this.itemTimer = 0;
    this.player.lane = 0;
    this.player.currentX = this.laneXPositions[1];
    this.player.targetX = this.laneXPositions[1];
    this.player.y = this.player.baseY;
    this.player.vy = 0;
    this.player.isJumping = false;
    this.player.isRolling = false;
    this.unlockedMilestones.clear();
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.distance += Math.floor(this.speed / 2);
    this.score += 1;
    this.speed = 7 + Math.min(6, this.distance / 1000);
    this.cloudOffset = (this.cloudOffset + 0.3) % this.width;

    // Smooth lane transition (Lerp)
    this.player.currentX += (this.player.targetX - this.player.currentX) * 0.25;

    // Jump Physics
    if (this.player.isJumping) {
      this.player.y += this.player.vy;
      this.player.vy += 0.9;
      if (this.player.y >= this.player.baseY) {
        this.player.y = this.player.baseY;
        this.player.isJumping = false;
        this.player.vy = 0;
      }
    }

    // Roll Timer
    if (this.player.isRolling) {
      this.player.rollTimer--;
      if (this.player.rollTimer <= 0) {
        this.player.isRolling = false;
      }
    }

    // Spawn Obstacles (Trains, Chevron Barrier, Hurdles)
    this.spawnTimer++;
    if (this.spawnTimer > 52 - Math.min(18, Math.floor(this.distance / 250))) {
      this.spawnTimer = 0;
      const laneIdx = Math.floor(Math.random() * 3);
      const types = ['chevron_barrier', 'train', 'low_hurdle'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.obstacles.push({
        lane: laneIdx - 1,
        z: 0.1,
        type: type,
        height: type === 'train' ? 75 : 42,
        width: type === 'train' ? 60 : 50
      });
    }

    // Spawn Collectibles (Gold coins, FTU Badges)
    this.itemTimer++;
    if (this.itemTimer > 24) {
      this.itemTimer = 0;
      const laneIdx = Math.floor(Math.random() * 3);
      this.collectibles.push({
        lane: laneIdx - 1,
        z: 0.1,
        type: Math.random() > 0.85 ? 'ftu_badge' : 'coin'
      });
    }

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z += 0.016 * (this.speed / 6);

      // Check collision
      if (obs.z >= 0.84 && obs.z <= 0.98 && obs.lane === this.player.lane) {
        let hit = false;
        if (obs.type === 'chevron_barrier' && !this.player.isJumping) {
          hit = true;
        } else if (obs.type === 'low_hurdle' && !this.player.isRolling && !this.player.isJumping) {
          hit = true;
        } else if (obs.type === 'train' && (!this.player.isJumping || this.player.y > this.player.baseY - 48)) {
          hit = true;
        }

        if (hit) {
          this.triggerGameOver();
          return;
        }
      }

      if (obs.z > 1.15) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.z += 0.016 * (this.speed / 6);

      // Collect item
      if (item.z >= 0.84 && item.z <= 0.98 && item.lane === this.player.lane) {
        if (item.type === 'coin') {
          this.coins++;
          this.score += 15;
          if (window.subwayAudio) window.subwayAudio.playCoin();
        } else if (item.type === 'ftu_badge') {
          this.coins += 5;
          this.score += 100;
          if (window.subwayAudio) window.subwayAudio.playMysteryBox();
          if (window.showGameToast) window.showGameToast('⭐ NHẬN HUY HIỆU FTU (+100 PTS)!');
        }
        this.collectibles.splice(i, 1);
        continue;
      }

      if (item.z > 1.15) {
        this.collectibles.splice(i, 1);
      }
    }

    // Check CV Milestones
    this.checkMilestones();
  }

  checkMilestones() {
    if (this.distance >= 200 && !this.unlockedMilestones.has(200)) {
      this.unlockedMilestones.add(200);
      if (window.showGameToast) window.showGameToast('🎓 Mở khóa: GPA 3.57/4.0 ĐH Ngoại Thương!');
    } else if (this.distance >= 600 && !this.unlockedMilestones.has(600)) {
      this.unlockedMilestones.add(600);
      if (window.showGameToast) window.showGameToast('🔥 Mở khóa: Dự án Livestream Tết 2025 Gia Bảo!');
    } else if (this.distance >= 1000 && !this.unlockedMilestones.has(1000)) {
      this.unlockedMilestones.add(1000);
      if (window.showGameToast) window.showGameToast('🚀 Mở khóa: Trưởng BTC Sự kiện YRC & IBConnect!');
    }
  }

  triggerGameOver() {
    this.isRunning = false;
    this.isGameOver = true;
    if (window.subwayAudio) window.subwayAudio.playWhistle();
    this.drawGameOver();
  }

  draw() {
    // 1. Bright Sunny Sky Gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.vanishingY);
    skyGrad.addColorStop(0, '#6AEEFD');
    skyGrad.addColorStop(0.65, '#C6FEFE');
    skyGrad.addColorStop(1, '#ffffff');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.vanishingY);

    // Fluffy Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.drawCloud(120 - this.cloudOffset, 35, 45);
    this.drawCloud(420 - this.cloudOffset, 25, 60);
    this.drawCloud(700 - this.cloudOffset, 40, 50);
    if (this.cloudOffset > 0) {
      this.drawCloud(this.width + 120 - this.cloudOffset, 35, 45);
    }

    // Distant Tropical Mountain & Pagoda Silhouettes
    this.ctx.fillStyle = '#4856be';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.vanishingY);
    this.ctx.lineTo(80, this.vanishingY - 45);
    this.ctx.lineTo(160, this.vanishingY - 20);
    this.ctx.lineTo(260, this.vanishingY - 65);
    this.ctx.lineTo(380, this.vanishingY - 25);
    this.ctx.lineTo(520, this.vanishingY - 70);
    this.ctx.lineTo(650, this.vanishingY - 30);
    this.ctx.lineTo(this.width, this.vanishingY - 50);
    this.ctx.lineTo(this.width, this.vanishingY);
    this.ctx.closePath();
    this.ctx.fill();

    // 2. Lush Green Grass & Side Tropical Village
    this.ctx.fillStyle = '#2ed573';
    this.ctx.fillRect(0, this.vanishingY, this.width, this.height - this.vanishingY);

    // Side Houses with Terracotta Roofs (Subway Surfers Bali style)
    this.drawSideDecorations();

    // 3. Sandy Wood Track Bed (Perspective Trapezoid)
    this.ctx.fillStyle = '#F7BE76';
    this.ctx.beginPath();
    this.ctx.moveTo(this.vanishingX - 55, this.vanishingY);
    this.ctx.lineTo(this.vanishingX + 55, this.vanishingY);
    this.ctx.lineTo(this.width * 0.88, this.height);
    this.ctx.lineTo(this.width * 0.12, this.height);
    this.ctx.closePath();
    this.ctx.fill();

    // Track Outlines
    this.ctx.strokeStyle = '#354093';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(this.vanishingX - 55, this.vanishingY);
    this.ctx.lineTo(this.width * 0.12, this.height);
    this.ctx.moveTo(this.vanishingX + 55, this.vanishingY);
    this.ctx.lineTo(this.width * 0.88, this.height);
    this.ctx.stroke();

    // 4. Moving Wooden Sleepers (Ties)
    const tieOffset = (this.distance * 3.5) % 40;
    this.ctx.fillStyle = '#a9714b';
    this.ctx.strokeStyle = '#354093';
    this.ctx.lineWidth = 2;

    for (let y = this.vanishingY + 8; y < this.height; y += 22) {
      const curY = y + (tieOffset * (y - this.vanishingY)) / 220;
      if (curY > this.height) continue;
      const progress = (curY - this.vanishingY) / (this.height - this.vanishingY);
      const halfW = 45 + progress * (this.width * 0.38);
      const tieH = Math.max(3, 8 * progress);

      this.ctx.fillRect(this.vanishingX - halfW, curY, halfW * 2, tieH);
      this.ctx.strokeRect(this.vanishingX - halfW, curY, halfW * 2, tieH);
    }

    // 5. Shiny Steel Metallic Rails (3 Lanes = 4 Rails)
    for (let i = 0; i < 4; i++) {
      const bottomX = (this.width * 0.22) + i * (this.width * 0.185);
      const topX = this.vanishingX - 36 + i * 24;

      // Rail Base
      this.ctx.strokeStyle = '#354093';
      this.ctx.lineWidth = 5;
      this.ctx.beginPath();
      this.ctx.moveTo(topX, this.vanishingY);
      this.ctx.lineTo(bottomX, this.height);
      this.ctx.stroke();

      // Rail Top Shine
      this.ctx.strokeStyle = '#FFED6D';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(topX, this.vanishingY);
      this.ctx.lineTo(bottomX, this.height);
      this.ctx.stroke();
    }

    // 6. Draw Collectibles & Obstacles sorted by depth z
    const renderList = [
      ...this.collectibles.map(c => ({ ...c, isItem: true })),
      ...this.obstacles.map(o => ({ ...o, isObstacle: true }))
    ].sort((a, b) => a.z - b.z);

    renderList.forEach(obj => {
      const currentLaneX = this.getPerspectiveX(obj.lane, obj.z);
      const currentY = this.vanishingY + (this.height - this.vanishingY) * obj.z;
      const scale = obj.z * 1.1;

      if (obj.isItem) {
        if (obj.type === 'coin') {
          // Glistening 3D Coin
          this.ctx.save();
          this.ctx.translate(currentLaneX, currentY - 22 * scale);
          this.ctx.fillStyle = '#FFED6D';
          this.ctx.strokeStyle = '#354093';
          this.ctx.lineWidth = 3 * scale;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 13 * scale, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          // Star inside coin
          this.ctx.fillStyle = '#E31902';
          this.ctx.font = `bold ${Math.max(6, 11 * scale)}px sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('★', 0, 0);
          this.ctx.restore();
        } else if (obj.type === 'ftu_badge') {
          // FTU Badge
          this.ctx.save();
          this.ctx.translate(currentLaneX, currentY - 26 * scale);
          this.ctx.fillStyle = '#E31902';
          this.ctx.strokeStyle = '#354093';
          this.ctx.lineWidth = 3 * scale;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 16 * scale, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = `bold ${Math.max(7, 10 * scale)}px 'Baloo 2', sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('FTU', 0, 0);
          this.ctx.restore();
        }
      } else if (obj.isObstacle) {
        if (obj.type === 'train') {
          // Red & White Passenger Subway Train Car (Matching screenshot!)
          const w = obj.width * scale;
          const h = obj.height * scale;
          
          // Train Body (White/Cream base)
          this.ctx.fillStyle = '#ffffff';
          this.ctx.strokeStyle = '#354093';
          this.ctx.lineWidth = 3 * scale;
          this.ctx.fillRect(currentLaneX - w / 2, currentY - h, w, h);
          this.ctx.strokeRect(currentLaneX - w / 2, currentY - h, w, h);

          // Train Red Bottom Stripe
          this.ctx.fillStyle = '#E31902';
          this.ctx.fillRect(currentLaneX - w / 2, currentY - h * 0.45, w, h * 0.45);
          this.ctx.strokeRect(currentLaneX - w / 2, currentY - h * 0.45, w, h * 0.45);

          // Train Roof (Grey)
          this.ctx.fillStyle = '#C6FEFE';
          this.ctx.fillRect(currentLaneX - w / 2, currentY - h, w, h * 0.15);

          // Train Windshield & Headlights
          this.ctx.fillStyle = '#354093';
          this.ctx.fillRect(currentLaneX - w / 2 + 5 * scale, currentY - h + 12 * scale, w - 10 * scale, h * 0.3);
          
          this.ctx.fillStyle = '#FFED6D';
          this.ctx.beginPath();
          this.ctx.arc(currentLaneX - w / 3.2, currentY - 10 * scale, 5 * scale, 0, Math.PI * 2);
          this.ctx.arc(currentLaneX + w / 3.2, currentY - 10 * scale, 5 * scale, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (obj.type === 'chevron_barrier') {
          // Red & White Diagonal Chevron Hurdle (Matching screenshot 3!)
          const w = obj.width * scale;
          const h = obj.height * scale;

          // Wooden Support Posts
          this.ctx.fillStyle = '#a9714b';
          this.ctx.strokeStyle = '#354093';
          this.ctx.lineWidth = 2 * scale;
          this.ctx.fillRect(currentLaneX - w / 2 + 4 * scale, currentY - h, 6 * scale, h);
          this.ctx.fillRect(currentLaneX + w / 2 - 10 * scale, currentY - h, 6 * scale, h);

          // Barrier Board with Red/White Chevrons
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(currentLaneX - w / 2, currentY - h, w, h * 0.75);
          this.ctx.strokeRect(currentLaneX - w / 2, currentY - h, w, h * 0.75);

          // Chevron Stripes
          this.ctx.fillStyle = '#E31902';
          this.ctx.beginPath();
          this.ctx.moveTo(currentLaneX, currentY - h * 0.35);
          this.ctx.lineTo(currentLaneX - w / 2, currentY - h);
          this.ctx.lineTo(currentLaneX - w / 4, currentY - h);
          this.ctx.lineTo(currentLaneX, currentY - h * 0.55);
          this.ctx.lineTo(currentLaneX + w / 4, currentY - h);
          this.ctx.lineTo(currentLaneX + w / 2, currentY - h);
          this.ctx.closePath();
          this.ctx.fill();
        } else if (obj.type === 'low_hurdle') {
          // Yellow road block hurdle
          const w = obj.width * scale;
          const h = (obj.height * 0.6) * scale;
          this.ctx.fillStyle = '#FFED6D';
          this.ctx.strokeStyle = '#354093';
          this.ctx.lineWidth = 2 * scale;
          this.ctx.fillRect(currentLaneX - w / 2, currentY - h, w, h);
          this.ctx.strokeRect(currentLaneX - w / 2, currentY - h, w, h);
        }
      }
    });

    // 7. Draw Surfer Character (Nguyễn Minh Phương)
    this.drawPlayer();

    // 8. Draw Subway Surfers In-Game HUD (Screenshot matching style!)
    this.drawHUD();
  }

  drawCloud(x, y, r) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    this.ctx.arc(x + r * 0.5, y - r * 0.2, r * 0.7, 0, Math.PI * 2);
    this.ctx.arc(x + r * 1.1, y, r * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawSideDecorations() {
    // Left & Right Terracotta Houses
    this.ctx.fillStyle = '#F7BE76';
    this.ctx.strokeStyle = '#354093';
    this.ctx.lineWidth = 3;

    // Left House
    this.ctx.fillRect(0, this.vanishingY + 30, 70, 160);
    this.ctx.strokeRect(0, this.vanishingY + 30, 70, 160);

    // Left Roof
    this.ctx.fillStyle = '#E31902';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.vanishingY);
    this.ctx.lineTo(85, this.vanishingY + 35);
    this.ctx.lineTo(0, this.vanishingY + 35);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Right House
    this.ctx.fillStyle = '#F7BE76';
    this.ctx.fillRect(this.width - 70, this.vanishingY + 30, 70, 160);
    this.ctx.strokeRect(this.width - 70, this.vanishingY + 30, 70, 160);

    // Right Roof
    this.ctx.fillStyle = '#E31902';
    this.ctx.beginPath();
    this.ctx.moveTo(this.width, this.vanishingY);
    this.ctx.lineTo(this.width - 85, this.vanishingY + 35);
    this.ctx.lineTo(this.width, this.vanishingY + 35);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  getPerspectiveX(lane, z) {
    const bottomX = this.laneXPositions[lane + 1];
    const topX = this.vanishingX + lane * 24;
    return topX + (bottomX - topX) * z;
  }

  drawPlayer() {
    const x = this.player.currentX;
    const y = this.player.y;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Glowing Neon Hoverboard
    this.ctx.fillStyle = '#E31902';
    this.ctx.strokeStyle = '#354093';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 10, 26, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Hoverboard Yellow Thruster Center
    this.ctx.fillStyle = '#FFED6D';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 10, 15, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Player Body (FTU Red & White Jacket Outfit)
    if (this.player.isRolling) {
      this.ctx.fillStyle = '#E31902';
      this.ctx.strokeStyle = '#354093';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, -10, 18, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      // Legs
      this.ctx.fillStyle = '#354093';
      this.ctx.fillRect(-10, -15, 7, 22);
      this.ctx.fillRect(3, -15, 7, 22);

      // FTU Jacket (Red & White)
      this.ctx.fillStyle = '#E31902';
      this.ctx.strokeStyle = '#354093';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(-14, -42, 28, 28);
      this.ctx.strokeRect(-14, -42, 28, 28);

      // White stripe
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-5, -42, 10, 28);

      // Head & Hair
      this.ctx.fillStyle = '#354093';
      this.ctx.beginPath();
      this.ctx.arc(0, -52, 13, 0, Math.PI * 2);
      this.ctx.fill();

      // Face
      this.ctx.fillStyle = '#F7BE76';
      this.ctx.beginPath();
      this.ctx.arc(0, -50, 9, 0, Math.PI * 2);
      this.ctx.fill();

      // Cap / Headband (Sky Cyan)
      this.ctx.fillStyle = '#6AEEFD';
      this.ctx.fillRect(-10, -60, 20, 6);
    }

    this.ctx.restore();
  }

  drawHUD() {
    this.ctx.save();

    // Top-Left: Pause Button (Subway Surfers Style)
    this.ctx.fillStyle = '#6AEEFD';
    this.ctx.strokeStyle = '#354093';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(16, 14, 38, 38, 10);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(27, 24, 5, 18);
    this.ctx.fillRect(36, 24, 5, 18);

    // Top-Right: Score Box with Multiplier (Black rounded bar)
    this.ctx.fillStyle = 'rgba(53, 64, 147, 0.9)';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(this.width - 180, 14, 164, 38, 12);
    this.ctx.fill();
    this.ctx.stroke();

    // Multiplier (Yellow)
    this.ctx.font = "900 16px 'Baloo 2', sans-serif";
    this.ctx.fillStyle = '#FFED6D';
    this.ctx.fillText(`x35`, this.width - 170, 39);

    // Score digits
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'right';
    const scoreStr = String(this.score).padStart(6, '0');
    this.ctx.fillText(scoreStr, this.width - 26, 39);

    // Coin counter badge below score
    this.ctx.fillStyle = 'rgba(53, 64, 147, 0.9)';
    this.ctx.beginPath();
    this.ctx.roundRect(this.width - 130, 58, 114, 32, 10);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFED6D';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`★`, this.width - 120, 80);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${this.coins}`, this.width - 26, 80);

    // Bottom-Left: Power-Up Gauge (Matching screenshot 2!)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.strokeStyle = '#354093';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(16, this.height - 48, 110, 24, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Green Segments
    this.ctx.fillStyle = '#2ed573';
    for (let s = 0; s < 7; s++) {
      this.ctx.fillRect(22 + s * 14, this.height - 43, 10, 14);
    }

    this.ctx.restore();
  }

  drawGameOver() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.font = "900 38px 'Baloo 2', sans-serif";
    this.ctx.fillStyle = '#E31902';
    this.ctx.fillText('GAME OVER!', this.width / 2, this.height / 2 - 45);

    this.ctx.font = "700 20px 'Nunito', sans-serif";
    this.ctx.fillStyle = '#354093';
    this.ctx.fillText(`Điểm số: ${this.score} pts • Quãng đường: ${this.distance}m • Coins: ${this.coins}`, this.width / 2, this.height / 2);

    this.ctx.font = "800 16px 'Baloo 2', sans-serif";
    this.ctx.fillStyle = '#E31902';
    this.ctx.fillText('Nhấn nút "CHƠI LẠI" bên dưới để tiếp tục lướt ván!', this.width / 2, this.height / 2 + 40);
    this.ctx.restore();
  }
}

// Attach to global window
window.SubwayRunnerGame = SubwayRunnerGame;
