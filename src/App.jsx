import { useState, useEffect } from "react"
import Lottie from "lottie-react"
import morning from "./assets/morning.jpg"
import day from "./assets/day.jpg"
import evening from "./assets/evening.jpg"
import noTasks from "./assets/states/no-tasks.jpg"
import completedImg from "./assets/states/completed.jpg"
import WaterTracker from "./WaterTracker"

function getTimePeriod() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 19) return "day"
  return "evening"
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
  { key: "energized", label: "Заряжен", file: "Energized.json" },
  { key: "calm", label: "Спокоен", file: "calm.json" },
  { key: "normal", label: "Нормально", file: "normal.json" },
  { key: "tired", label: "Устал", file: "tired.json" },
  { key: "stress", label: "Стресс", file: "Stress.json" },
]

const DEMO_TASKS = [
  { id: 1, title: "Прочитать книгу", time: "30 минут", done: false },
  { id: 2, title: "Сделать зарядку", time: "до 10:00", done: false },
  { id: 3, title: "Позвонить другу", time: "до 18:00", done: false },
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

function getTodayKey() {
  return new Date().toDateString()
}

function loadTasks() {
  const key = getTodayKey()
  try {
    const stored = localStorage.getItem("luma_tasks_" + key)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function saveTasks(tasks) {
  const key = getTodayKey()
  localStorage.setItem("luma_tasks_" + key, JSON.stringify(tasks))
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
  const [tasks, setTasks] = useState(() => loadTasks() || DEMO_TASKS)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newTime, setNewTime] = useState("")

  useEffect(() => {
    if (selectedMood) {
      localStorage.setItem("luma_mood", selectedMood)
    }
  }, [selectedMood])

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  function addTask() {
    if (!newTitle.trim()) return
    const task = {
      id: Date.now(),
      title: newTitle.trim(),
      time: newTime.trim() || "",
      done: false,
    }
    setTasks((prev) => [...prev, task])
    setNewTitle("")
    setNewTime("")
    setShowModal(false)
  }

  const allDone = tasks.length > 0 && tasks.every((t) => t.done)
  const [activeTab, setActiveTab] = useState("home")

  return (
    <>
      {activeTab === "water" ? (
        <WaterTracker />
      ) : (
        <div className="w-full min-h-screen bg-[#FAF7F2] flex flex-col px-4 py-5 gap-3 relative pb-24">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{header.subtitle}</p>
          <p className="text-lg font-semibold">{header.greeting}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200" />
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
        <div className="flex justify-between gap-[10px]">
          {moods.map((mood) => (
            <button
              key={mood.key}
              onClick={() => setSelectedMood(mood.key)}
              className={`flex flex-col items-center justify-center w-[68px] h-[88px] rounded-[18px] transition-all duration-300 ${
                selectedMood === mood.key
                  ? "bg-[#FFF2CC] scale-105 shadow-md"
                  : "bg-[#FAFAFA] scale-100"
              }`}
            >
              <div className="w-[56px] h-[56px]">
                <MoodAnimation file={mood.file} />
              </div>
              <span className="text-[11px] font-medium text-gray-500 leading-tight mt-1">
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Today Tasks */}
      <div className="relative">
        <p className="text-sm font-semibold mb-3">Что сегодня в планах</p>

        {/* STATE 3 — All completed */}
        {allDone && (
          <div className="flex flex-col items-center py-4">
            <div className="w-[90%] rounded-2xl overflow-hidden mb-3">
              <img src={completedImg} alt="" className="w-full h-36 object-cover" />
            </div>
            <p className="text-sm font-semibold text-gray-800">🎯 Отличная работа</p>
            <p className="text-xs text-gray-400 mt-1">Все задачи выполнены.<br />Сегодня ты был продуктивен.</p>
          </div>
        )}

        {/* STATE 1 — No tasks */}
        {!allDone && tasks.length === 0 && (
          <div className="flex flex-col items-center py-4">
            <img src={noTasks} alt="" className="w-40 h-40 object-cover rounded-2xl mb-3" />
            <p className="text-sm font-semibold text-gray-800">✨ Сегодня можно выдохнуть</p>
            <p className="text-xs text-gray-400 mt-1">Планов на сегодня нет.<br />Используй день для себя.</p>
          </div>
        )}

        {/* STATE 2 — Active tasks */}
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
                    {t.done ? "Выполнено" : t.time || "В процессе"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Floating add button */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-28 right-4 w-[52px] h-[52px] rounded-full bg-[#FF8A3D] shadow-lg flex items-center justify-center z-40"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[320px] bg-white rounded-3xl p-6 shadow-2xl animate-in">
            <p className="text-base font-semibold mb-4">Новая задача</p>
            <input
              type="text"
              placeholder="Что нужно сделать?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[#F3F1ED] rounded-xl px-4 py-3 text-sm outline-none mb-3"
            />
            <input
              type="text"
              placeholder="Время (необязательно)"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-[#F3F1ED] rounded-xl px-4 py-3 text-sm outline-none mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#F3F1ED] text-sm font-medium text-gray-500"
              >
                Отмена
              </button>
              <button
                onClick={addTask}
                className="flex-1 py-3 rounded-xl bg-[#FF8A3D] text-sm font-medium text-white"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

        </div>
      )}

      {/* Bottom Navigation (shared) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] bg-white rounded-[32px] shadow-xl flex items-center justify-around h-[86px] px-3 z-50">
        {[
          { key: "home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { key: "planner", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { key: "progress", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
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
