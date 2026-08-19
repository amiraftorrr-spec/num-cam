import { useState } from 'react'
import ParticleField from './components/ParticleField'
import { useHandGesture } from './hooks/useHandGesture'

export default function App() {
  const { videoRef, canvasRef, number, isClapped, ready, error } = useHandGesture()
  const [showSkeleton, setShowSkeleton] = useState(true)

  return (
    <div className="relative w-screen h-screen bg-[#030308] overflow-hidden select-none font-sans">
      {/* Background Neon Particle Canvas */}
      <ParticleField number={number} isClapped={isClapped} />

      {/* Loading / Error status banner */}
      {(!ready || error) && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/90 text-sm tracking-wide bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-2xl flex items-center gap-2">
          {!ready && !error && (
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          )}
          {error || 'در حال آماده‌سازی دوربین و هوش مصنوعی...'}
        </div>
      )}

      {/* Camera Preview Card & Joint Toggle */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2.5">
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
          <span>نمایش مفصل‌ها (Skeleton)</span>
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              showSkeleton ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-white/20'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
