import { useState, useEffect, useRef } from 'react'
import ParticleField from './components/ParticleField'
import { useHandGesture } from './hooks/useHandGesture'
import { sound } from './utils/soundFX'

const MODES = [
  { id: 'magic', name: '✨ ژست جادویی', desc: 'اعداد ۱-۱۰ یا ژست FUCK YOU' },
  { id: 'gun', name: '🔫 تفنگ انگشتی', desc: 'با انگشتت شلیک کن (👉) و هدف‌های پرنده فضایی رو بترکون' },
  { id: 'slicer', name: '⚔️ شمشیر نینجا', desc: 'با لبه انگشتت مثل نینجا میوه‌ها و گوی‌های پرنده را در هوا قاچ کن' },
  { id: 'forcefield', name: '🌀 میدان مغناطیسی', desc: 'ذرات را با دستت در فضا لمس کن، بچرخان و با مشت جمع کن' },
  { id: 'game', name: '🎯 بازی رفلکس', desc: 'عدد درخواستی را با انگشتانت سریع نشان بده و امتیاز بگیر' },
  { id: 'kamehameha', name: '💥 کامه‌هامه ها', desc: 'دو کف دست را روبروی هم نزدیک کن تا گوی انرژی شارژ شود، سپس شلیک کن!' },
  { id: 'hockey', name: '🏓 ایرهاکی نئونی', desc: 'دو نفره با دو دست یا تک‌نفره در برابر ربات هوشمند، توپ را گل کن!' },
  { id: 'synth', name: '🎵 ساز ترمین هوایی', desc: 'با ارتفاع و حرکت دست در فضا فرکانس و نت‌های موسیقی زنده بنواز' },
]

const THEMES = [
  { id: 'cyber', name: '🌌 سایبرپانک', bg: 'from-cyan-500 to-indigo-500' },
  { id: 'matrix', name: '🟩 ماتریکس', bg: 'from-emerald-500 to-green-600' },
  { id: 'fire', name: '🔥 آتش نئونی', bg: 'from-amber-500 to-red-600' },
]

export default function App() {
  const [currentMode, setCurrentMode] = useState('magic')
  const [currentTheme, setCurrentTheme] = useState('cyber')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const { videoRef, canvasRef, number, specialGesture, handPhysics, isClapped, ready, error } = useHandGesture(
    currentMode,
    showSkeleton
  )

  // Air Hockey score state
  const [hockeyScore, setHockeyScore] = useState({ p1: 0, p2: 0 })

  // Synth note state
  const [synthInfo, setSynthInfo] = useState({ note: 'C4', freq: 261 })

  // Game Mode States
  const [targetNumber, setTargetNumber] = useState(3)
  const currentTargetRef = useRef(3)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [answerState, setAnswerState] = useState(null)
  const lastGameNumberRef = useRef(0)
  const [navTarget, setNavTarget] = useState(null)
  const navInteractionRef = useRef({
    smoothedX: null,
    smoothedY: null,
    target: null,
    pinchStartedAt: 0,
    clicked: false,
    lastClickAt: 0,
    buttons: [],
    buttonBounds: new Map(),
    renderedTarget: null,
  })

  // Arcade Score for Slicer & Gun
  const [arcadeScore, setArcadeScore] = useState(0)

  // Sound toggle
  const toggleSound = () => {
    sound.enabled = !soundEnabled
    setSoundEnabled(!soundEnabled)
  }

  const getNextTargetNumber = () => {
    const prev = currentTargetRef.current
    const candidates = [1, 2, 3, 4, 5].filter((n) => n !== prev)
    const next = candidates[Math.floor(Math.random() * candidates.length)]
    currentTargetRef.current = next
    return next
  }

  // Game Mode Logic Loop
  useEffect(() => {
    if (currentMode !== 'game' || !gameStarted || gameFinished) return

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          sound.playSuccess()
          setGameFinished(true)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentMode, gameStarted, gameFinished])

  // Check if player solved the game target
  useEffect(() => {
    if (currentMode !== 'game' || !gameStarted || gameFinished || number === 0 || number === lastGameNumberRef.current) {
      if (number === 0) lastGameNumberRef.current = 0
      return
    }

    lastGameNumberRef.current = number
    if (number === targetNumber) {
      sound.playSuccess()
      setScore((s) => s + 1)
      setTargetNumber(getNextTargetNumber())
      setAnswerState('correct')
    } else {
      sound.playFail()
      setAnswerState('wrong')
    }
  }, [currentMode, number, targetNumber, gameStarted, gameFinished])

  // Reset arcade score on mode switch
  useEffect(() => {
    setArcadeScore(0)
    if (currentMode !== 'game') {
      setGameStarted(false)
      setGameFinished(false)
      setScore(0)
      setTimeLeft(20)
      setAnswerState(null)
    }
  }, [currentMode])

  useEffect(() => {
    const interaction = navInteractionRef.current
    const refreshButtons = () => {
      interaction.buttons = Array.from(document.querySelectorAll('button')).filter((button) => {
        const bounds = button.getBoundingClientRect()
        return bounds.width > 0 && bounds.height > 0
      })
      interaction.buttonBounds = new Map(
        interaction.buttons.map((button) => [button, button.getBoundingClientRect()])
      )
    }

    refreshButtons()
    window.addEventListener('resize', refreshButtons)
    const layoutObserver = new ResizeObserver(refreshButtons)
    layoutObserver.observe(document.body)
    const domObserver = new MutationObserver(refreshButtons)
    domObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('resize', refreshButtons)
      layoutObserver.disconnect()
      domObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const hands = handPhysics.hands || []
    const hand = hands[0]
    const interaction = navInteractionRef.current

    if (!hand) {
      interaction.smoothedX = null
      interaction.smoothedY = null
      interaction.target = null
      interaction.pinchStartedAt = 0
      interaction.clicked = false
      if (interaction.renderedTarget !== null) {
        interaction.renderedTarget = null
        setNavTarget(null)
      }
      return
    }

    const rawX = hand.indexX * window.innerWidth
    const rawY = hand.indexY * window.innerHeight
    const smoothing = 0.35
    interaction.smoothedX =
      interaction.smoothedX === null
        ? rawX
        : interaction.smoothedX + (rawX - interaction.smoothedX) * smoothing
    interaction.smoothedY =
      interaction.smoothedY === null
        ? rawY
        : interaction.smoothedY + (rawY - interaction.smoothedY) * smoothing

    const x = interaction.smoothedX
    const y = interaction.smoothedY
    const activationPadding = 64
    const buttons = interaction.buttons.filter((button) => document.body.contains(button))
    const distanceToButton = (button) => {
      const bounds = interaction.buttonBounds.get(button) || button.getBoundingClientRect()
      const dx = Math.max(bounds.left - x, 0, x - bounds.right)
      const dy = Math.max(bounds.top - y, 0, y - bounds.bottom)
      return Math.hypot(dx, dy)
    }

    const closestButton = buttons.reduce((closest, button) => {
      const distance = distanceToButton(button)
      return !closest || distance < closest.distance ? { button, distance } : closest
    }, null)

    if (!closestButton || closestButton.distance > activationPadding) {
      interaction.target = null
      interaction.pinchStartedAt = 0
      interaction.clicked = false
      if (interaction.renderedTarget !== null) {
        interaction.renderedTarget = null
        setNavTarget(null)
      }
      return
    }

    const currentDistance = interaction.target ? distanceToButton(interaction.target) : Infinity
    const target =
      interaction.target &&
      document.body.contains(interaction.target) &&
      currentDistance <= closestButton.distance + 18
        ? interaction.target
        : closestButton.button

    if (target !== interaction.target) {
      interaction.target = target
      interaction.pinchStartedAt = 0
      interaction.clicked = false
    }

    const targetBounds = interaction.buttonBounds.get(target) || target.getBoundingClientRect()
    const targetState = {
      left: targetBounds.left,
      top: targetBounds.top,
      width: targetBounds.width,
      height: targetBounds.height,
      isPinching: hand.isPinch,
    }
    const targetKey = `${targetState.left}:${targetState.top}:${targetState.width}:${targetState.height}:${targetState.isPinching}`
    if (interaction.renderedTarget !== targetKey) {
      interaction.renderedTarget = targetKey
      setNavTarget(targetState)
    }

    if (!hand.isPinch) {
      interaction.pinchStartedAt = 0
      interaction.clicked = false
      return
    }

    const now = performance.now()
    if (!interaction.pinchStartedAt) interaction.pinchStartedAt = now

    if (
      !interaction.clicked &&
      now - interaction.pinchStartedAt >= 140 &&
      now - interaction.lastClickAt >= 500
    ) {
      target.click()
      interaction.clicked = true
      interaction.lastClickAt = now
    }
  }, [handPhysics])

  const startGame = () => {
    setScore(0)
    setTimeLeft(20)
    const firstTarget = Math.floor(Math.random() * 5) + 1
    currentTargetRef.current = firstTarget
    setTargetNumber(firstTarget)
    setAnswerState(null)
    lastGameNumberRef.current = 0
    setGameFinished(false)
    setGameStarted(true)
  }

  return (
    <div className="relative w-screen h-screen bg-[#030308] overflow-hidden select-none font-sans">
      {/* Background Interactive Particle Canvas */}
      <ParticleField
        number={currentMode === 'game' ? (gameStarted && !gameFinished ? targetNumber : 0) : number}
        isClapped={currentMode === 'game' ? false : isClapped}
        mode={currentMode}
        theme={currentTheme}
        handPhysics={handPhysics}
        onSlicerScore={(pts) => setArcadeScore((s) => s + pts)}
        onGunScore={(pts) => setArcadeScore((s) => s + pts)}
        onHockeyScore={(p1, p2) => setHockeyScore({ p1, p2 })}
        onSynthNote={(note, freq) => setSynthInfo({ note, freq })}
      />

      {/* TOP NAVBAR (Modes, Themes, Sound Toggle) */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 flex w-max max-w-[96vw] items-center gap-2 bg-slate-950/85 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-20 overflow-x-auto scrollbar-none">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setCurrentMode(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                currentMode === m.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-white/10 hidden sm:block" />

        {/* Theme Selector */}
        <div className="flex items-center gap-1">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => setCurrentTheme(th.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                currentTheme === th.id
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${th.bg}`} />
              <span className="hidden md:inline">{th.name}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-white/10" />

        {/* Sound FX Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl border transition-all text-xs shrink-0 ${
            soundEnabled
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              : 'bg-white/5 border-white/10 text-white/40'
          }`}
          title="صداهای افکت"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </header>

      {navTarget && (
        <div
          className={`pointer-events-none fixed z-30 rounded-lg border-2 transition-[left,top,width,height,box-shadow] duration-100 ${
            navTarget.isPinching
              ? 'border-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.75)]'
              : 'border-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.6)]'
          }`}
          style={{
            left: navTarget.left - 2,
            top: navTarget.top - 2,
            width: navTarget.width + 4,
            height: navTarget.height + 4,
          }}
        />
      )}

      {/* GAME MODE HUD BANNER */}
      {currentMode === 'game' && ready && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 bg-black/80 backdrop-blur-md border border-cyan-500/30 px-7 py-4 rounded-2xl shadow-2xl z-10 animate-fade-in">
          {!gameStarted && !gameFinished && (
            <button
              onClick={startGame}
              className="px-6 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-sm hover:bg-cyan-300 transition-colors"
            >
              شروع بازی
            </button>
          )}
          {gameFinished && (
            <div className="flex items-center gap-4">
              <span className="text-white font-bold">بازی تمام شد</span>
              <span className="text-2xl font-black text-amber-400">امتیاز: {score}</span>
              <button
                onClick={startGame}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-300 transition-colors"
              >
                دوباره
              </button>
            </div>
          )}
          {gameStarted && !gameFinished && (
            <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs">امتیاز</span>
            <span className="text-2xl font-black text-amber-400">{score}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs">عدد درخواستی</span>
            <span className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {targetNumber}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs">زمان</span>
            <span className={`text-2xl font-black ${timeLeft === 1 ? 'text-red-400 animate-ping' : 'text-cyan-400'}`}>
              {timeLeft}s
            </span>
          </div>
              {answerState && (
                <span className={answerState === 'correct' ? 'text-emerald-400 text-xs font-bold' : 'text-red-400 text-xs font-bold'}>
                  {answerState === 'correct' ? 'درست' : 'غلط'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ARCADE SLICER / GUN SCORE HUD */}
      {['slicer', 'gun'].includes(currentMode) && ready && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/75 backdrop-blur-md border border-amber-500/30 px-7 py-2.5 rounded-2xl shadow-2xl z-10 animate-fade-in pointer-events-none">
          <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">
            {currentMode === 'slicer' ? '⚔️ امتیاز شمشیربازی' : '🔫 امتیاز شکار فضایی'}
          </span>
          <span className="text-3xl font-black text-amber-400">{arcadeScore}</span>
        </div>
      )}

      {/* KAMEHAMEHA HUD */}
      {currentMode === 'kamehameha' && ready && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-md border border-cyan-500/40 px-6 py-2.5 rounded-2xl shadow-2xl z-10 animate-fade-in pointer-events-none">
          <span className="text-2xl animate-pulse">💥</span>
          <div className="flex flex-col text-right">
            <span className="text-cyan-300 text-xs font-bold">دو کف دست را به هم نزدیک کن تا شارژ شود</span>
            <span className="text-slate-400 text-[11px]">با دور کردن ناگهانی دست‌ها، پرتو انرژی مهیب شلیک می‌شود!</span>
          </div>
        </div>
      )}

      {/* AIR HOCKEY HUD */}
      {currentMode === 'hockey' && ready && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-5 bg-black/85 backdrop-blur-md border border-cyan-500/40 px-6 py-2.5 rounded-2xl shadow-2xl z-10 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span className="text-cyan-300 text-xs font-bold">بازیکن ۱ (آبی): {hockeyScore.p1}</span>
          </div>
          <span className="text-slate-500 font-bold">:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span className="text-rose-400 text-xs font-bold">بازیکن ۲ / ربات (قرمز): {hockeyScore.p2}</span>
          </div>
          <button
            onClick={() => setHockeyScore({ p1: 0, p2: 0 })}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] transition-colors"
          >
            ریست
          </button>
        </div>
      )}

      {/* THEREMIN SYNTH HUD */}
      {currentMode === 'synth' && ready && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/85 backdrop-blur-md border border-purple-500/40 px-6 py-2.5 rounded-2xl shadow-2xl z-10 animate-fade-in pointer-events-none">
          <span className="text-2xl">🎵</span>
          <div className="flex flex-col text-right">
            <span className="text-purple-300 text-xs font-bold">ساز ترمین هوایی (Air Theremin)</span>
            <span className="text-slate-400 text-[11px]">ارتفاع دست = نت و فرکانس | عرض دست = حجم و افکت صدا</span>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/40 px-3 py-1 rounded-xl text-center">
            <span className="text-purple-200 text-sm font-black">{synthInfo.note}</span>
            <span className="text-purple-400 text-[10px] block">{synthInfo.freq} Hz</span>
          </div>
        </div>
      )}

      {/* MAGIC ACTIVE GESTURE BANNER */}
      {currentMode === 'magic' && ready && !error && number !== 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full shadow-2xl animate-fade-in pointer-events-none z-10">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            {specialGesture ? 'Magic Spell' : 'Detected'}
          </span>
          <span className="text-2xl font-black bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            {specialGesture === 'FUCK YOU' ? 'FUCK YOU' : number}
          </span>
        </div>
      )}

      {/* Loading / Error status banner */}
      {(!ready || error) && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white/90 text-sm tracking-wide bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-2xl flex items-center gap-2 z-20">
          {!ready && !error && (
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          )}
          {error || 'در حال آماده‌سازی دوربین و هوش مصنوعی...'}
        </div>
      )}

      {/* Bottom Hint Banner */}
      <div className="absolute bottom-5 right-5 text-right bg-slate-950/70 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl hidden md:block max-w-sm pointer-events-none">
        <p className="text-cyan-400 text-xs font-bold mb-1">
          {MODES.find((m) => m.id === currentMode)?.name}
        </p>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          {MODES.find((m) => m.id === currentMode)?.desc}
        </p>
      </div>

      {/* Camera Preview Card & Joint Toggle */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2.5 z-20">
        <div className="relative w-52 h-40 rounded-2xl overflow-hidden border border-white/15 bg-black/70 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-cyan-500/40">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-80"
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none transition-opacity duration-200 ${
              showSkeleton ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Preview / Skeleton Toggle Button */}
        <button
          onClick={() => setShowSkeleton((prev) => !prev)}
          className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium border backdrop-blur-md transition-all duration-200 ${
            showSkeleton
              ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10'
          }`}
        >
          <span>{showSkeleton ? 'اسکلت دست فعال' : 'اسکلت دست مخفی'}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              showSkeleton ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-600'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
