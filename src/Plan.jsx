import { useState, useMemo, useRef, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
]

const categories = ["Спорт", "Учёба", "Здоровье", "Работа"]

// Generate dates from past 30 days to future 60 days
function generateDates() {
  const dates = []
  const today = new Date()
  for (let i = -30; i <= 60; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push({
      fullDate: d,
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      weekday: d.getDay(),
    })
  }
  return dates
}

const ALL_DATES = generateDates()

function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function Plan() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Здоровье")
  const scrollRef = useRef(null)

  const currentMonthLabel = useMemo(() => {
    return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  }, [selectedDate])

  async function loadTasks(date) {
    const dateKey = formatDateKey(date)
    const docRef = doc(db, "planner", dateKey)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      setTasks(docSnap.data().tasks || [])
    } else {
      setTasks([])
    }
  }

  function selectDate(date) {
    setSelectedDate(date)
    loadTasks(date)
  }

  async function toggleTask(id) {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    setTasks(updatedTasks)
    const dateKey = formatDateKey(selectedDate)
    const docRef = doc(db, "planner", dateKey)
    await setDoc(docRef, { tasks: updatedTasks }, { merge: true })
  }

  async function addTask() {
    if (!newTitle.trim()) return
    const task = {
      id: Date.now(),
      title: newTitle.trim(),
      time: "",
      done: false,
      category: selectedCategory,
    }
    const updatedTasks = [...tasks, task]
    const dateKey = formatDateKey(selectedDate)
    const docRef = doc(db, "planner", dateKey)
    await setDoc(docRef, { tasks: updatedTasks }, { merge: true })
    setTasks(updatedTasks)
    setNewTitle("")
    setShowModal(false)
  }

  useEffect(() => {
    loadTasks(today)

    const todayIndex = ALL_DATES.findIndex(
      d => d.fullDate.toDateString() === new Date().toDateString()
    )

    if (scrollRef.current && todayIndex !== -1) {
      const itemWidth = 60
      const offset = todayIndex * itemWidth - window.innerWidth / 2 + itemWidth / 2

      scrollRef.current.scrollTo({
        left: offset,
        behavior: "smooth"
      })
    }
  }, [])

  const isToday = (d) =>
    d.fullDate.toDateString() === today.toDateString()
  const isSelected = (d) =>
    d.fullDate.toDateString() === selectedDate.toDateString()

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] flex flex-col px-4 py-5 gap-4 relative pb-24">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Организуй день</p>
          <p className="text-lg font-semibold">План дня ✨</p>
        </div>
        <div className="w-[48px] h-[48px] p-0 overflow-hidden rounded-full bg-gray-200">
          <img
            src=""
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 2. Horizontal Scrollable Date Selector */}
      <div>
        <p className="text-sm font-semibold mb-3 text-gray-800">{currentMonthLabel}</p>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {ALL_DATES.map((d, i) => {
            const selected = isSelected(d)
            const todayFlag = isToday(d)
            return (
              <button
                key={i}
                onClick={() => selectDate(d.fullDate)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-2xl transition-all duration-200 ${
                  selected
                    ? "bg-[#F4C64E] text-black shadow-md"
                    : todayFlag
                    ? "border-2 border-[#F4C64E] bg-white text-gray-800"
                    : "bg-[#F3F1ED] text-[#8A8A8A]"
                }`}
              >
                <span className="text-[10px] leading-tight mb-0.5">
                  {["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][d.fullDate.getDay()]}
                </span>
                <span className="text-base font-semibold leading-tight">{d.day}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Big Hero Card */}
      <div className="w-full rounded-[28px] p-6 bg-gradient-to-br from-[#FFF8F0] via-[#FFECD9] to-[#FFE5C8] shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-2xl font-bold text-gray-800 mb-2">Сегодня великий день ✨</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Планируй, двигайся, достигай
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F4C64E]"></div>
            <p className="text-xs text-gray-500">{tasks.length} задач на сегодня</p>
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-20">
          📋
        </div>
      </div>

      {/* 4. Task Timeline */}
      <div className="relative">
        <p className="text-sm font-semibold mb-3 text-gray-800">Сегодняшние задачи</p>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <p className="text-sm text-gray-400">На этот день задач нет</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {tasks.map((t, index) => (
              <div key={t.id} className="flex items-start gap-3 relative">
                {/* Timeline line */}
                {index < tasks.length - 1 && (
                  <div className="absolute left-[11px] top-[28px] bottom-[-8px] w-[2px] bg-gray-200" />
                )}

                {/* Check button */}
                <button
                  onClick={() => toggleTask(t.id)}
                  className={`flex-shrink-0 w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-all duration-200 z-10 active:scale-90 ${
                    t.done
                      ? "bg-[#34C759] border-[#34C759]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {t.done && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Task content */}
                <div className="flex-1 pb-3">
                  <span className={`text-sm font-medium ${t.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {t.title}
                  </span>
                  {t.time && (
                    <span className={`text-xs block mt-0.5 ${t.done ? "text-gray-400" : "text-[#F97344]"}`}>
                      {t.time}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-36 right-4 w-[52px] h-[52px] rounded-full bg-[#FF8A3D] shadow-lg flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[320px] bg-white rounded-3xl p-6 shadow-2xl">
            <p className="text-base font-semibold mb-4">Новая задача</p>
            <input
              type="text"
              placeholder="Название задачи"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[#F3F1ED] rounded-xl px-4 py-3 text-sm outline-none mb-3"
            />

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Категория</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedCategory === cat
                        ? "bg-[#F4C64E] text-black"
                        : "bg-[#F3F1ED] text-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

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
  )
}