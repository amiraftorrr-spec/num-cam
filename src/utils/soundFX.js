// Web Audio API Synthesizer for futuristic sci-fi sound effects
class SoundFX {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.ctx = new AudioContext()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  // Futuristic synth beep when number/gesture changes
  playGestureChange(value) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      const now = this.ctx.currentTime
      const baseFreq = typeof value === 'number' && value > 0 ? 220 + value * 65 : 440

      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch (e) {}
  }

  // Laser shot for Finger Gun
  playLaser() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(950, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.19)
    } catch (e) {}
  }

  // Blade / Slice whoosh for Slicer game
  playSlash() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.1)

      gain.gain.setValueAtTime(0.14, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.13)
    } catch (e) {}
  }

  // Spider-Man web shooter "thwip" sound
  playWeb() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08)
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.16)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.19)
    } catch (e) {}
  }

  // Sparkle chime for Air Drawing
  playSparkle() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      const freq = 600 + Math.random() * 600
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.09)
    } catch (e) {}
  }

  // Explosion / Kamehameha blast
  playExplosion() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4)

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.5)
    } catch (e) {}
  }

  // Success / Score point sound in Game mode
  playSuccess() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08) // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16) // G5

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.32)
    } catch (e) {}
  }

  // Error / Timeout sound
  playFail() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.setValueAtTime(160, now + 0.1)

      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.26)
    } catch (e) {}
  }

  // Kamehameha continuous charging sound
  startChargeHum() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx || this.chargeOsc) return

    try {
      this.chargeOsc = this.ctx.createOscillator()
      this.chargeGain = this.ctx.createGain()
      this.chargeOsc.type = 'sawtooth'
      this.chargeOsc.frequency.setValueAtTime(90, this.ctx.currentTime)
      this.chargeGain.gain.setValueAtTime(0.01, this.ctx.currentTime)
      this.chargeOsc.connect(this.chargeGain)
      this.chargeGain.connect(this.ctx.destination)
      this.chargeOsc.start()
    } catch (e) {}
  }

  setChargeIntensity(level) { // level from 0.0 to 1.0
    if (!this.ctx || !this.chargeOsc || !this.chargeGain) return
    try {
      const now = this.ctx.currentTime
      const freq = 90 + level * 350
      const vol = Math.min(0.2, 0.02 + level * 0.16)
      this.chargeOsc.frequency.setTargetAtTime(freq, now, 0.05)
      this.chargeGain.gain.setTargetAtTime(vol, now, 0.05)
    } catch (e) {}
  }

  stopChargeHum() {
    if (this.chargeOsc) {
      try {
        this.chargeOsc.stop()
        this.chargeOsc.disconnect()
      } catch (e) {}
      this.chargeOsc = null
      this.chargeGain = null
    }
  }

  // Mega Kamehameha blast
  playMegaBeam() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    this.stopChargeHum()

    try {
      const now = this.ctx.currentTime
      // Low sub bass rumble + roaring sawtooth
      const osc = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc2.type = 'sine'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(45, now + 1.2)
      osc2.frequency.setValueAtTime(150, now)
      osc2.frequency.exponentialRampToValueAtTime(30, now + 1.2)

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3)

      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc2.start(now)
      osc.stop(now + 1.3)
      osc2.stop(now + 1.3)
    } catch (e) {}
  }

  // Doctor strange magic chime
  playMagicSparks() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      const freq = 1200 + Math.random() * 800
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + 0.09)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.11)
    } catch (e) {}
  }

  // Air Hockey Puck Bounce
  playHockeyHit() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(680, now)
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08)

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.1)
    } catch (e) {}
  }

  playGoal() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sawtooth'
        const freq = 440 * Math.pow(1.25, i)
        osc.frequency.setValueAtTime(freq, now + i * 0.1)
        gain.gain.setValueAtTime(0.15, now + i * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.18)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + i * 0.1)
        osc.stop(now + (i + 1) * 0.19)
      }
    } catch (e) {}
  }

  // Black Hole deep cosmic hum
  startBlackHoleHum() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx || this.bhOsc) return

    try {
      this.bhOsc = this.ctx.createOscillator()
      this.bhGain = this.ctx.createGain()
      this.bhOsc.type = 'sine'
      this.bhOsc.frequency.setValueAtTime(55, this.ctx.currentTime)
      this.bhGain.gain.setValueAtTime(0.15, this.ctx.currentTime)
      this.bhOsc.connect(this.bhGain)
      this.bhGain.connect(this.ctx.destination)
      this.bhOsc.start()
    } catch (e) {}
  }

  stopBlackHoleHum() {
    if (this.bhOsc) {
      try {
        this.bhOsc.stop()
        this.bhOsc.disconnect()
      } catch (e) {}
      this.bhOsc = null
      this.bhGain = null
    }
  }

  playSupernova() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    this.stopBlackHoleHum()

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(20, now + 1.5)

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 1.6)
    } catch (e) {}
  }

  // Theremin live synthesizer
  updateTheremin(freq, volume) {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return

    if (!this.thereminOsc) {
      try {
        this.thereminOsc = this.ctx.createOscillator()
        this.thereminGain = this.ctx.createGain()
        this.thereminOsc.type = 'sine'
        this.thereminOsc.frequency.setValueAtTime(freq, this.ctx.currentTime)
        this.thereminGain.gain.setValueAtTime(volume, this.ctx.currentTime)
        this.thereminOsc.connect(this.thereminGain)
        this.thereminGain.connect(this.ctx.destination)
        this.thereminOsc.start()
      } catch (e) {}
    } else {
      const now = this.ctx.currentTime
      this.thereminOsc.frequency.setTargetAtTime(freq, now, 0.03)
      this.thereminGain.gain.setTargetAtTime(volume, now, 0.03)
    }
  }

  stopTheremin() {
    if (this.thereminOsc) {
      try {
        this.thereminOsc.stop()
        this.thereminOsc.disconnect()
      } catch (e) {}
      this.thereminOsc = null
      this.thereminGain = null
    }
  }

  // Avatar Element sound effects
  playFireWhoosh() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(240, now)
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.2)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.23)
    } catch (e) {}
  }

  playWaterSplash() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.15)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.17)
    } catch (e) {}
  }

  playIceCrack() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1400, now)
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.06)
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.14)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.16)
    } catch (e) {}
  }
}

export const sound = new SoundFX()
