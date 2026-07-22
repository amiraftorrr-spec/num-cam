import ParticleField from './components/ParticleField'
import { useHandGesture } from './hooks/useHandGesture'

export default function App() {
  const { videoRef, number, ready, error } = useHandGesture()

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <ParticleField number={number} />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 text-sm tracking-widest select-none">
        {error
          ? error
          : ready
          ? `عدد تشخیص داده‌شده: ${number}`
          : 'در حال راه‌اندازی دوربین...'}
      </div>

      <div className="absolute bottom-4 left-4 w-40 h-32 rounded-lg overflow-hidden border border-white/20 shadow-lg">
        <video
          ref={videoRef}
          className="w-full h-full object-cover -scale-x-100"
          muted
          playsInline
        />
      </div>
    </div>
  )
}
