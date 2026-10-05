/* ==========================================================================
   SUBWAY SURFERS AUDIO ENGINE
   Plays authentic theme MP3 music + Web Audio API interactive SFX
   ========================================================================== */

class SubwayAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmAudio = null;
    this.bgmPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.bgmAudio) {
      this.bgmAudio = document.getElementById('bgmAudio');
      if (this.bgmAudio) {
        this.bgmAudio.volume = 0.65;
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  startBgm() {
    this.init();
    if (!this.bgmAudio) return;
    this.bgmAudio.muted = this.isMuted;
    const playPromise = this.bgmAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.bgmPlaying = true;
      }).catch(err => {
        console.log('Audio autoplay prevented or waiting for interaction:', err);
      });
    }
  }

  stopBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmPlaying = false;
    }
  }

  toggleBgmMusic() {
    this.init();
    if (!this.bgmAudio) return false;
    if (this.bgmAudio.paused) {
      this.startBgm();
      return true;
    } else {
      this.stopBgm();
      return false;
    }
  }

  // --- COIN COLLECT SOUND (Classic Double Chime) ---
  playCoin() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Note 1: B5 (987.77 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Note 2: E6 (1318.51 Hz)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);
    gain2.gain.setValueAtTime(0.3, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  }

  // --- JUMP / BOING SOUND ---
  playJump() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // --- SPRAY CAN HISS SOUND ---
  playSpray() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3500;
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // --- POLICE INSPECTOR WHISTLE ---
  playWhistle() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2200, now);
    osc2.frequency.setValueAtTime(2260, now);

    // Trill modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(16, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    lfo.start(now);
    lfo.stop(now + 0.6);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  // --- MYSTERY BOX FANFARE (TADA!) ---
  playMysteryBox() {
    if (this.isMuted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx === 3 ? 0.6 : 0.2));
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (idx === 3 ? 0.6 : 0.2));
    });
  }

  // --- UI POP / CLICK ---
  playClick() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

// Global instance
window.subwayAudio = new SubwayAudioEngine();
