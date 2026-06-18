import { useState, useEffect } from "react"
import Lottie from "lottie-react"
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore"
import { db } from "./firebase"
import morning from "./assets/morning.jpg"
import day from "./assets/day.jpg"
import evening from "./assets/evening.jpg"
import noTasks from "./assets/states/no-tasks.jpg"
import completedImg from "./assets/states/completed.jpg"
import avatar1 from "./assets/states/avatar1.png"
import WaterTracker from "./WaterTracker"
import Plan from "./Plan"
import Progress from "./Progress"

function getTimePeriod() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 18) return "day"
  return "evening"
}

function getMoodPeriodLabel(period) {
  if (period === "morning") return "утро"
  if (period === "day") return "день"
  return "вечер"
}

const headerData = {
  morning: { greeting: "Доброе утро ☀️", subtitle: "Новый день начинается" },
  day: { greeting: "Добрый день 🌤", subtitle: "Сохраняй продуктивность" },
  evening: { greeting: "Добрый вечер 🌙", subtitle: "Пора замедлиться" },
}

const heroData = {
  morning: { image: morning, subtitle: "Начни день правильно" },
  day: { image: day, subtitle: "Время действовать 🚀" },
  evening: { image: evening, subtitle: "Восстанови силы 😌" },
}

function getWeekDays() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
  return labels.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { label, date: d.getDate(), fullDate: d }
  })
}

const moods = [
  { key: "energized", label: "Заряжен", file: "Energized.json", emoji: "😄" },
  { key: "calm", label: "Спокоен", file: "calm.json", emoji: "😌" },
  { key: "normal", label: "Нормально", file: "normal.json", emoji: "🙂" },
  { key: "tired", label: "Устал", file: "tired.json", emoji: "😴" },
  { key: "stress", label: "Стресс", file: "Stress.json", emoji: "😰" },
]

function MoodAnimation({ file }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/animations/${file}`)
      .then((r) => r.json())
      .then(setData)
  }, [file])
  if (!data) return <div className="w-10 h-10" />
  return <Lottie animationData={data} loop autoplay style={{ width: "100%", height: "100%" }} />
}

function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function App() {
  const period = getTimePeriod()
  const header = headerData[period]
  const hero = heroData[period]
  const weekDays = getWeekDays()
  const todayStr = new Date().toDateString()
  const defaultSelected = weekDays.findIndex((d) => d.fullDate.toDateString() === todayStr)
  const [selectedDay, setSelectedDay] = useState(defaultSelected)
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem("luma_mood") || null)
  const [tasks, setTasks] = useState([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [moodData, setMoodData] = useState({})
  const [selectedMoodPeriod, setSelectedMoodPeriod] = useState(null)
  const [moodLoading, setMoodLoading] = useState(true)

  useEffect(() => {
    if (selectedMood) {
      localStorage.setItem("luma_mood", selectedMood)
    }
  }, [selectedMood])

  useEffect(() => {
    async function loadTodayTasks() {
      const dateKey = formatDateKey(new Date())
      const docRef = doc(db, "planner", dateKey)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setTasks(docSnap.data().tasks || [])
      } else {
        setTasks([])
      }
    }
    loadTodayTasks()
  }, [])

  useEffect(() => {
    const today = new Date()
    const dateKey = formatDateKey(today)
    const unsub = onSnapshot(doc(db, "moodTracker", dateKey), (snap) => {
      if (snap.exists()) {
        setMoodData(snap.data())
        const currentPeriod = getTimePeriod()
        if (snap.data()[currentPeriod] && snap.data()[currentPeriod].mood) {
          setSelectedMoodPeriod(currentPeriod)
        } else {
          setSelectedMoodPeriod(null)
        }
      } else {
        setMoodData({})
        setSelectedMoodPeriod(null)
      }
      setMoodLoading(false)
    })
    return () => unsub()
  }, [])

  async function handleMoodSelect(moodKey) {
    const currentPeriod = getTimePeriod()
    if (moodData[currentPeriod] && moodData[currentPeriod].mood) {
      return
    }
    const today = new Date()
    const dateKey = formatDateKey(today)
    const docRef = doc(db, "moodTracker", dateKey)
    await setDoc(docRef, {
      [currentPeriod]: {
        mood: moodKey,
        time: serverTimestamp(),
      },
    }, { merge: true })
    setSelectedMoodPeriod(currentPeriod)
  }

  async function toggleTask(id) {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    const dateKey = formatDateKey(new Date())
    const docRef = doc(db, "planner", dateKey)
    await updateDoc(docRef, { tasks: updatedTasks })
    setTasks(updatedTasks)
  }

  const allDone = tasks.length > 0 && tasks.every((t) => t.done)
  const [activeTab, setActiveTab] = useState("home")

  return (
    <>
      {activeTab === "water" ? (
        <WaterTracker />
      ) : activeTab === "planner" ? (
        <Plan />
      ) : activeTab === "progress" ? (
        <Progress />
      ) : (
        <div className="w-full min-h-screen bg-[#FAF7F2] flex flex-col px-4 py-5 gap-3 relative pb-24">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{header.subtitle}</p>
          <p className="text-lg font-semibold">{header.greeting}</p>
        </div>
        <div className="w-[48px] h-[48px] p-0 overflow-hidden rounded-full cursor-pointer" onClick={() => setShowProfileModal(true)}>
          <img
            src={avatar1}
            alt="Avatar"
            className="w-full h-full object-cover block scale-[1.35] shadow-[0_3px_10px_rgba(0,0,0,0.06)] border border-white/50 hover:scale-[1.03] transition-all duration-[250ms]"
          />
        </div>
      </div>

      {/* 2. Week Calendar */}
      <div className="flex justify-between">
        {weekDays.map((day, i) => (
          <button
            key={day.label}
            onClick={() => setSelectedDay(i)}
            className={`flex flex-col items-center justify-center w-[42px] h-[58px] rounded-[18px] transition-all duration-300 ${
              i === selectedDay
                ? "bg-[#F4C64E] text-black shadow-md"
                : "bg-[#F3F1ED] text-[#8A8A8A]"
            }`}
          >
            <span className="text-[10px] leading-tight">{day.label}</span>
            <span className="text-base font-semibold leading-tight">{day.date}</span>
          </button>
        ))}
      </div>

      {/* 3. Hero Card */}
      <div className="relative w-full h-[260px] rounded-[28px] overflow-hidden transition-opacity duration-500" key={period}>
        <img src={hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.20))",
          }}
        />
        <div className="absolute bottom-0 left-0 p-5">
          <p className="text-white/80 text-sm mt-1 leading-tight">
            {hero.subtitle}
          </p>
        </div>
      </div>

      {/* 4. Mood Section */}
      <div>
        <p className="text-sm font-semibold mb-3">Как настроение?</p>
        {selectedMoodPeriod && (
          <p className="text-xs text-[#F46A3A] font-semibold mb-2">
            Выбрано на {getMoodPeriodLabel(selectedMoodPeriod)}
          </p>
        )}
        <div className="flex justify-between gap-[10px]">
          {moods.map((mood) => {
            const isLocked = selectedMoodPeriod !== null && selectedMoodPeriod !== getTimePeriod()
            const isSelected = moodData[getTimePeriod()] && moodData[getTimePeriod()].mood === mood.key
            return (
              <button
                key={mood.key}
                onClick={() => handleMoodSelect(mood.key)}
                disabled={isLocked || isSelected}
                className={`flex flex-col items-center justify-center w-[68px] h-[88px] rounded-[18px] transition-all duration-300 ${
                  isSelected
                    ? "bg-[#FFF2CC] scale-105 shadow-md"
                    : isLocked
                    ? "opacity-40 cursor-not-allowed"
                    : "bg-[#FAFAFA] scale-100 hover:scale-105"
                }`}
              >
                <div className={`w-[56px] h-[56px] ${isSelected ? "animate-pulse" : ""}`}>
                  <MoodAnimation file={mood.file} />
                </div>
                <span className="text-[11px] font-medium text-gray-500 leading-tight mt-1">
                  {mood.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Today Tasks */}
      <div className="relative">
        <p className="text-sm font-semibold mb-3">Что сегодня в планах</p>

        {/* STATE — All completed */}
        {allDone && (
          <div className="flex flex-col items-center py-4">
            <div className="w-[90%] rounded-2xl overflow-hidden mb-3">
              <img src={completedImg} alt="" className="w-full h-36 object-cover" />
            </div>
            <p className="text-sm font-semibold text-gray-800">🎯 Отличная работа</p>
            <p className="text-xs text-gray-400 mt-1">Все задачи выполнены.<br />Сегодня ты был продуктивен.</p>
          </div>
        )}

        {/* STATE — No tasks */}
        {!allDone && tasks.length === 0 && (
          <div className="flex flex-col items-center mt-8 mb-6">
            <img src={noTasks} alt="" className="w-80 h-80 object-cover rounded-3xl mb-6" />
            <p className="text-lg text-gray-700 font-medium text-center">✨ На сегодня задач нет</p>
          </div>
        )}

        {/* STATE — Active tasks */}
        {!allDone && tasks.length > 0 && (
          <div className="flex flex-col gap-2">
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={`w-full flex items-center gap-3 bg-white rounded-[18px] p-[14px] shadow-sm transition-all duration-200 ${
                  t.done ? "opacity-60" : ""
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    t.done
                      ? "bg-green-500 border-green-500"
                      : "border-orange-400"
                  }`}
                >
                  {t.done && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-medium ${t.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {t.title}
                  </span>
                  <span className={`text-xs ${t.done ? "text-green-500" : "text-orange-400"}`}>
                    {t.done ? "Выполнено" : "В процессе"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 transition-opacity duration-300 ${showProfileModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowProfileModal(false)}>
        <div className={`w-full max-w-[320px] bg-white rounded-[24px] p-6 shadow-2xl relative transition-all duration-300 ${showProfileModal ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowProfileModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center mb-6">
            <p className="text-2xl mb-2">👋 Привет!</p>
            <p className="text-sm leading-relaxed" style={{ color: '#5B5B5B', fontWeight: 500 }}>
              Войди, чтобы сохранять свой прогресс и синхронизировать данные.
            </p>
          </div>

          <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3.5 mb-4 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">или</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <button className="w-full py-3.5 rounded-xl bg-[#FF8A3D] text-white text-sm font-medium hover:bg-[#e67a2e] transition-colors">
            Продолжить без аккаунта
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Ты сможешь войти позже в любой момент.
          </p>
        </div>
      </div>

        </div>
      )}

      {/* Bottom Navigation (shared) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] bg-white rounded-[32px] shadow-xl flex items-center justify-around h-[86px] px-3 z-50">
        {[
          { key: "home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { key: "planner", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { key: "progress", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
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
    </>
  )
}