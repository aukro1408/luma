import { useState, useEffect } from "react"
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "./firebase"
import avatar1 from "./assets/states/avatar1.png"

function CircularProgress({ percent, size = 90, strokeWidth = 7, color = "#FF8A3D", bgColor = "rgba(255,255,255,0.35)" }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const center = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white drop-shadow-md">{percent}%</span>
      </div>
    </div>
  )
}

export default function Progress() {
  const [activeTab, setActiveTab] = useState("progress")
  const [waterMl, setWaterMl] = useState(0)
  const [tasks, setTasks] = useState([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubWater = onSnapshot(doc(db, "waterProgress", "default"), (snap) => {
      if (snap.exists()) {
        setWaterMl(snap.data().amount || 0)
      }
    })

    const today = new Date()
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    const unsubTasks = onSnapshot(doc(db, "planner", dateKey), (snap) => {
      if (snap.exists()) {
        setTasks(snap.data().tasks || [])
      } else {
        setTasks([])
      }
      setLoading(false)
    })

    return () => {
      unsubWater()
      unsubTasks()
    }
  }, [])

  useEffect(() => {
    async function calcStreak() {
      const today = new Date()
      let streakCount = 0
      let checkDate = new Date(today)

      for (let i = 0; i < 365; i++) {
        const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`
        const snap = await getDocs(query(collection(db, "planner"), where("__name__", "==", dateKey)))
        
        if (snap.empty) {
          break
        }
        
        const data = snap.docs[0].data()
        const dayTasks = data.tasks || []
        const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.done)
        
        if (allDone) {
          streakCount++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
      
      setStreak(streakCount)
    }

    calcStreak()
  }, [])

  const planned = tasks.length
  const inProgress = tasks.filter((t) => !t.done).length
  const done = tasks.filter((t) => t.done).length
  const productivityPercent = planned > 0 ? Math.round((done / planned) * 100) : 0
  const waterPercent = Math.min(Math.round((waterMl / 2000) * 100), 100)

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] flex flex-col px-4 py-5 gap-4 relative pb-24">
      {/* 1. Profile Card */}
      <div className="w-full rounded-[30px] p-5 shadow-lg relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FF8A3D 0%, #F46A3A 100%)" }}>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/40 shadow-md flex-shrink-0">
            <img src={avatar1} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Luma User 🌙</p>
            <p className="text-sm text-white/85">Your daily progress</p>
          </div>
        </div>
        <div className="absolute -right-4 -top-4 text-7xl opacity-15">⭐</div>
      </div>

      {/* 2. My Tasks */}
      <div>
        <p className="text-sm font-semibold mb-3 text-gray-800">Мои задачи</p>
        <div className="flex flex-col gap-2.5">
          <div className="w-full flex items-center gap-3 rounded-[22px] p-4 shadow-sm" style={{ background: "linear-gradient(135deg, #FFE5E5 0%, #FFD6D6 100%)" }}>
            <span className="text-xl">📌</span>
            <span className="text-sm font-semibold text-gray-700 flex-1">To Do</span>
            <span className="text-sm font-bold text-gray-800 bg-white/60 px-3 py-1 rounded-full">{planned}</span>
          </div>
          <div className="w-full flex items-center gap-3 rounded-[22px] p-4 shadow-sm" style={{ background: "linear-gradient(135deg, #FFF3E0 0%, #FFE8C9 100%)" }}>
            <span className="text-xl">⏳</span>
            <span className="text-sm font-semibold text-gray-700 flex-1">In Progress</span>
            <span className="text-sm font-bold text-gray-800 bg-white/60 px-3 py-1 rounded-full">{inProgress}</span>
          </div>
          <div className="w-full flex items-center gap-3 rounded-[22px] p-4 shadow-sm" style={{ background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)" }}>
            <span className="text-xl">✅</span>
            <span className="text-sm font-semibold text-gray-700 flex-1">Done</span>
            <span className="text-sm font-bold text-gray-800 bg-white/60 px-3 py-1 rounded-full">{done}</span>
          </div>
        </div>
      </div>

      {/* 3. Progress Cards */}
      <div className="flex gap-3">
        {/* Water Card */}
        <div className="flex-1 rounded-[28px] p-5 shadow-md flex flex-col items-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4DD0E1 0%, #26C6DA 100%)" }}>
          <div className="text-2xl mb-2 relative z-10">💧</div>
          <p className="text-xs font-semibold text-white/90 mb-3 relative z-10">Water</p>
          <CircularProgress percent={waterPercent} color="#FFFFFF" bgColor="rgba(255,255,255,0.3)" />
          <p className="text-xs text-white/90 text-center mt-2 relative z-10 font-medium">{waterMl} / 2000 ml</p>
        </div>

        {/* Productivity Card */}
        <div className="flex-1 rounded-[28px] p-5 shadow-md flex flex-col items-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FF8A80 0%, #FF6E6E 100%)" }}>
          <div className="text-2xl mb-2 relative z-10">🎯</div>
          <p className="text-xs font-semibold text-white/90 mb-3 relative z-10">Productivity</p>
          <CircularProgress percent={productivityPercent} color="#FFFFFF" bgColor="rgba(255,255,255,0.3)" />
          <p className="text-xs text-white/90 text-center mt-2 relative z-10 font-medium">{done} / {planned} tasks</p>
        </div>
      </div>

      {/* 4. Streak Card */}
      <div className="w-full rounded-[28px] p-5 shadow-md flex items-center gap-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #CE93D8 0%, #AB47BC 100%)" }}>
        <div className="text-3xl relative z-10">🔥</div>
        <div className="relative z-10">
          <p className="text-sm font-bold text-white">Streak</p>
          <p className="text-xs text-white/85 font-medium">{streak} days in a row</p>
        </div>
        <div className="absolute -right-3 -bottom-3 text-6xl opacity-20">⚡</div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] bg-white rounded-[32px] shadow-xl flex items-center justify-around h-[86px] px-3 z-50">
        {[
          { key: "home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { key: "planner", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { key: "progress", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2 2z" },
          { key: "water", icon: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-3 transition-all duration-300 ${
              activeTab === tab.key
                ? "bg-[#F46A3A] text-white rounded-full px-6 py-3"
                : "text-[#9CA3AF] p-3"
            }`}
          >
            <svg className="w-[30px] h-[30px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {activeTab === tab.key && (
              <span className="text-base font-semibold whitespace-nowrap">
                {tab.key === "home" ? "Главная" : tab.key === "planner" ? "План" : tab.key === "progress" ? "Прогресс" : "Вода"}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}