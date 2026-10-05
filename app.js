/* ==========================================================================
   SUBWAY SURFERS PORTFOLIO - MAIN APP LOGIC
   Interactions, Hook dismiss, Mystery box, Sound bindings, Modals & Toast
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const hookOverlay = document.getElementById('hookOverlay');
  const hookStartBtn = document.getElementById('hookStartBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const gameModalOverlay = document.getElementById('gameModalOverlay');
  const openGameBtns = document.querySelectorAll('.btn-open-game');
  const closeGameBtn = document.getElementById('closeGameBtn');
  const gameRestartBtn = document.getElementById('gameRestartBtn');
  const mysteryBoxCube = document.getElementById('mysteryBoxCube');
  const mysteryBoxTraits = document.getElementById('mysteryBoxTraits');
  const sprayMsgForm = document.getElementById('sprayMsgForm');
  const toastEl = document.getElementById('gameToast');
  const toastText = document.getElementById('toastText');

  let runnerGame = null;

  // --- TOAST NOTIFICATION UTILITY ---
  window.showGameToast = function(msg) {
    if (!toastEl) return;
    toastText.textContent = msg;
    toastEl.classList.add('show');
    if (window.subwayAudio) window.subwayAudio.playCoin();
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  };

  // --- 1. HOOK / SPLASH SCREEN DISMISSAL ---
  if (hookStartBtn && hookOverlay) {
    hookStartBtn.addEventListener('click', (e) => {
      // Audio trigger
      if (window.subwayAudio) {
        window.subwayAudio.init();
        window.subwayAudio.playWhistle();
        window.subwayAudio.playSpray();
        // Start background game music
        setTimeout(() => {
          window.subwayAudio.startBgm();
        }, 500);
      }

      // Particle spray burst at button center
      const rect = hookStartBtn.getBoundingClientRect();
      if (window.subwayParticles) {
        window.subwayParticles.spraySplash(rect.left + rect.width / 2, rect.top + rect.height / 2, 35);
      }

      // Smooth zoom dismiss
      hookOverlay.classList.add('dismissed');
      setTimeout(() => {
        hookOverlay.style.display = 'none';
      }, 850);

      window.showGameToast('🚀 Chào mừng đến với Subway Portfolio của Nguyễn Minh Phương!');
    });
  }

  // --- 2. GLOBAL CLICK SOUND & SPRAY EFFECTS ---
  document.addEventListener('click', (e) => {
    const clickable = e.target.closest('button, .ss-btn, .powerup-card, .contact-item, .hud-avatar');
    if (clickable) {
      if (window.subwayAudio && clickable !== hookStartBtn) {
        window.subwayAudio.playClick();
      }
      if (window.subwayParticles) {
        window.subwayParticles.spraySplash(e.clientX, e.clientY, 8);
      }
    }
  });

  // --- 3. SOUND & MUSIC TOGGLES ---
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (!window.subwayAudio) return;
      const isMuted = window.subwayAudio.toggleMute();
      soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      window.showGameToast(isMuted ? '🔇 Đã tắt âm thanh' : '🔊 Đã bật âm thanh game!');
    });
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
      if (!window.subwayAudio) return;
      const isPlaying = window.subwayAudio.toggleBgmMusic();
      musicToggleBtn.textContent = isPlaying ? '🎵 Tắt Nhạc' : '🎶 Bật Nhạc';
      window.showGameToast(isPlaying ? '🎶 Đang phát nhạc nền Subway!' : '⏹️ Đã tạm dừng nhạc nền');
    });
  }

  // --- 4. MYSTERY BOX INTERACTION ---
  let mysteryBoxOpened = false;
  if (mysteryBoxCube && mysteryBoxTraits) {
    mysteryBoxCube.addEventListener('click', (e) => {
      if (mysteryBoxOpened) return;
      mysteryBoxOpened = true;

      if (window.subwayAudio) {
        window.subwayAudio.playMysteryBox();
      }
      if (window.subwayParticles) {
        window.subwayParticles.burstConfetti();
        const rect = mysteryBoxCube.getBoundingClientRect();
        window.subwayParticles.spraySplash(rect.left + rect.width / 2, rect.top + rect.height / 2, 40);
      }

      mysteryBoxCube.textContent = '🎁';
      mysteryBoxCube.style.animation = 'none';
      mysteryBoxTraits.style.display = 'grid';
      window.showGameToast('🎉 MỞ KHÓA 5 PHẨM CHẤT VÀNG CỦA MINH PHƯƠNG!');
    });
  }

  // --- 5. MINI-GAME MODAL LOGIC ---
  function initGame() {
    if (!runnerGame) {
      runnerGame = new SubwayRunnerGame('subwayGameCanvas');
    }
    if (runnerGame) {
      runnerGame.start();
    }
  }

  openGameBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameModalOverlay) {
        gameModalOverlay.classList.add('active');
        initGame();
        if (window.subwayAudio) window.subwayAudio.playWhistle();
      }
    });
  });

  if (closeGameBtn && gameModalOverlay) {
    closeGameBtn.addEventListener('click', () => {
      gameModalOverlay.classList.remove('active');
      if (runnerGame) runnerGame.stop();
    });
  }

  if (gameRestartBtn) {
    gameRestartBtn.addEventListener('click', () => {
      if (runnerGame) runnerGame.start();
      if (window.subwayAudio) window.subwayAudio.playWhistle();
    });
  }

  // Mobile Virtual D-Pad buttons
  const dpadLeft = document.getElementById('dpadLeft');
  const dpadRight = document.getElementById('dpadRight');
  const dpadJump = document.getElementById('dpadJump');
  const dpadRoll = document.getElementById('dpadRoll');

  if (dpadLeft) dpadLeft.addEventListener('click', () => runnerGame && runnerGame.moveLane(-1));
  if (dpadRight) dpadRight.addEventListener('click', () => runnerGame && runnerGame.moveLane(1));
  if (dpadJump) dpadJump.addEventListener('click', () => runnerGame && runnerGame.jump());
  if (dpadRoll) dpadRoll.addEventListener('click', () => runnerGame && runnerGame.roll());

  // --- 6. SPRAY MESSAGE FORM SUBMISSION ---
  if (sprayMsgForm) {
    sprayMsgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('msgName');
      const textInput = document.getElementById('msgBody');
      const senderName = nameInput ? nameInput.value : 'Bạn';

      if (window.subwayAudio) {
        window.subwayAudio.playSpray();
        window.subwayAudio.playCoin();
      }
      if (window.subwayParticles) {
        window.subwayParticles.burstConfetti();
      }

      window.showGameToast(`🚀 Cảm ơn ${senderName}! Lời nhắn đã được xịt sơn gửi tới Phương!`);
      sprayMsgForm.reset();
    });
  }

  // --- 7. COPY CONTACT INFO BUTTONS ---
  const copyButtons = document.querySelectorAll('.btn-copy-contact');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy');
      if (val) {
        navigator.clipboard.writeText(val).then(() => {
          if (window.subwayAudio) window.subwayAudio.playCoin();
          window.showGameToast(`📋 Đã sao chép: ${val}`);
        });
      }
    });
  });

  // --- 8. DYNAMIC HUD STATS ON SCROLL ---
  const scoreBadge = document.getElementById('hudScoreValue');
  window.addEventListener('scroll', () => {
    if (scoreBadge) {
      const scrollDist = Math.floor(window.scrollY * 1.5);
      scoreBadge.textContent = `${scrollDist}m`;
    }
  });
});
