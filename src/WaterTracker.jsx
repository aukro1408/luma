import { useState, useEffect } from "react"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import waterImg from "./assets/water.png"

const GOAL_ML = 1000
const BAR_ML = 200
const TOTAL_BARS = GOAL_ML / BAR_ML

function Bubbles() {
  const bubbles = Array.from({ length: 30 }, (_, i) => {
    const sizes = [8, 12, 16]
    const durations = [7, 9, 11, 13]
    return {
      size: sizes[i % 3],
      left: Math.random() * 100,
      duration: durations[i % 4] + Math.random() * 2,
      delay: Math.random() * 10,
    }
  })

  return (
    <div className="fixed top-0 left-0 w-full h-screen pointer-events-none" style={{ zIndex: 1 }}>
      <style>{`
        @keyframes rise {
          0% { transform: translateY(0px); opacity: 0; }
          15% { opacity: 0.45; }
          100% { transform: translateY(-1200px); opacity: 0; }
        }
      `}</style>
      <div className="relative w-full h-full">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              bottom: "-60px",
              background: "rgba(255,255,255,0.55)",
              boxShadow: "0 0 8px rgba(255,255,255,0.5)",
              animation: `rise ${b.duration}s linear ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function WaterTracker() {
  const [ml, setMl] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "waterProgress", "default"), (snap) => {
      if (snap.exists()) {
        setMl(snap.data().amount || 0)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const percent = Math.min(Math.round((ml / GOAL_ML) * 100), 100)
  const filledBars = Math.floor(ml / BAR_ML)

  async function addWater() {
    const next = Math.min(ml + BAR_ML, GOAL_ML)
    setMl(next)
    await setDoc(doc(db, "waterProgress", "default"), { amount: next }, { merge: true })
    if (next >= GOAL_ML) {
      setShowPopup(true)
    }
  }

  async function reset() {
    setMl(0)
    await setDoc(doc(db, "waterProgress", "default"), { amount: 0 }, { merge: true })
    setShowPopup(false)
  }

  return (
    <div
      className="w-full min-h-screen relative flex flex-col items-center px-4 py-5 gap-6 overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #dff6ff 0%, #c8eeff 40%, #b8e7ff 100%)",
        paddingBottom: 180,
        zIndex: 0,
      }}
    >
      <Bubbles />

      <div className="relative z-[5] w-full flex flex-col items-center gap-6">
        {/* Header */}
        <div className="self-start">
          <p className="text-xs text-gray-500">Следи за водным балансом</p>
          <p className="text-lg font-semibold text-gray-800">Вода 💧</p>
        </div>

        {/* Hero illustration */}
        <div className="flex flex-col items-center -mt-4">
          <img src={waterImg} alt="" className="w-[95%] max-w-[400px] object-contain" />
          <div className="text-center -mt-6">
            <p className="text-2xl font-bold text-gray-800">{loading ? "..." : `${ml} / ${GOAL_ML} ml`}</p>
            <p className="text-sm font-semibold text-[#F97344] mt-1">{percent}% завершено</p>
          </div>
        </div>

        {/* H2O Bars */}
        <div className="w-full">
          <p className="text-sm font-semibold text-gray-800 mb-4 text-center">Дневная норма</p>
          <div className="flex items-end justify-center gap-4">
            {Array.from({ length: TOTAL_BARS }).map((_, i) => {
              const filled = i < filledBars
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-10 h-36 rounded-2xl overflow-hidden relative flex items-center justify-center"
                    style={{
                      background: filled
                        ? "linear-gradient(180deg, #7fdcff 0%, #42bdf5 55%, #1495e6 100%)"
                        : "rgba(255,255,255,0.45)",
                      border: filled
                        ? "1px solid rgba(255,255,255,0.5)"
                        : "1px solid rgba(255,255,255,0.65)",
                      backdropFilter: filled ? "none" : "blur(10px)",
                      boxShadow: filled
                        ? "0 0 12px rgba(80,180,255,0.35), inset 0 0 10px rgba(255,255,255,0.25)"
                        : "none",
                      transition: "all 0.5s ease-out",
                    }}
                  >
                    <span
                      className="relative z-10"
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      H₂O
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={addWater}
          disabled={ml >= GOAL_ML}
          className="w-14 h-14 rounded-full bg-[#F97344] shadow-lg flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          className="text-xs text-gray-500 underline underline-offset-2"
        >
          Сбросить
        </button>
      </div>

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-3xl p-7 shadow-2xl max-w-[300px] w-full text-center animate-in">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-base font-semibold text-gray-800">Отлично!</p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Ты выполнил цель на сегодня.<br />
              1000 ml воды выпито.<br />
              Так держать 💧
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-5 w-full py-3 rounded-xl bg-[#F97344] text-white text-sm font-medium"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}