import { useState, useEffect } from "react"

const LAT = 46.8433
const LON = 30.0792
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,weather_code,precipitation_probability_max,uv_index_max&forecast_days=5&timezone=auto`

function getTimePeriod() {
  const hour = new Date().getHours()
  if (hour >= 19 || hour <= 5) return "night"
  return "day"
}

function weatherText(code) {
  if (code <= 1) return "Ясно"
  if (code <= 3) return "Облачно"
  if (code <= 61) return "Небольшой дождь"
  return "Гроза"
}

function weatherIcon(code) {
  if (code <= 1) return "☀️"
  if (code <= 3) return "🌤"
  if (code <= 61) return "🌧"
  return "⛈"
}

function animateTemp(target) {
  return new Promise((resolve) => {
    const el = document.getElementById("weather-temp")
    if (!el) {
      resolve(target)
      return
    }
    let count = 0
    const interval = setInterval(() => {
      if (count >= target) {
        clearInterval(interval)
        resolve(target)
        return
      }
      count++
      el.textContent = count + "°"
    }, 40)
  })
}

function Stars() {
  const positions = [
    { left: 40, top: 40 },
    { left: 100, top: 60 },
    { left: 180, top: 30 },
    { left: 250, top: 90 },
    { left: 70, top: 120 },
  ]
  return (
    <>
      {positions.map((pos, i) => (
        <div
          key={i}
          className="star"
          style={{ left: pos.left + "px", top: pos.top + "px" }}
        />
      ))}
      <style>{`
        .star {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: twinkle 2s infinite;
        }
        @keyframes twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </>
  )
}

function Sun() {
  return (
    <div className="sun" />
  )
}

function Moon() {
  return (
    <div className="moon" />
  )
}

function Clouds() {
  return (
    <>
      <div className="cloud cloud1" />
      <div className="cloud cloud2" />
      <style>{`
        .cloud {
          position: absolute;
          background: white;
          opacity: 0.65;
          border-radius: 50px;
          animation: moveCloud 10s ease infinite;
        }
        .cloud1 {
          width: 78px;
          height: 24px;
          top: 45px;
          left: 28px;
        }
        .cloud2 {
          width: 55px;
          height: 18px;
          top: 82px;
          left: 80px;
          animation-delay: 2s;
        }
        @keyframes moveCloud {
          0% { transform: translateX(0); }
          50% { transform: translateX(10px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

export default function Weather() {
  const [period, setPeriod] = useState(getTimePeriod())
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriod(getTimePeriod())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function loadWeather() {
      try {
        const res = await fetch(API_URL)
        const data = await res.json()
        setWeather(data)
        if (data.current && data.current.temperature_2m !== undefined) {
          animateTemp(Math.round(data.current.temperature_2m))
        }
      } catch (e) {
        console.error("Weather load error:", e)
      } finally {
        setLoading(false)
      }
    }
    loadWeather()
  }, [])

  const isDay = period === "day"
  const current = weather?.current || {}
  const daily = weather?.daily || {}

  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

  return (
    <div
      className="w-full min-h-screen relative flex flex-col px-5 py-5 overflow-x-hidden"
      style={{
        background: "#F7F5F1",
        paddingBottom: 140,
        transition: "1s ease",
      }}
    >
      {!isDay && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: "#111827", transition: "1s ease", zIndex: 0 }}
        />
      )}

      <div className="relative z-10 flex flex-col gap-5" style={{ transition: "1s ease" }}>
        {/* Header */}
        <div className="fade" style={{ animationDelay: "0s" }}>
          <p className="subtitle">Твой комфорт сегодня</p>
          <p className="title">Погода</p>
        </div>

        {/* Hero */}
        <div
          className="hero fade"
          style={{
            background: isDay
              ? "linear-gradient(180deg, #A7DBFF 0%, #FFE4CF 100%)"
              : "linear-gradient(180deg, #1E2B4B 0%, #3A4970 100%)",
            animationDelay: "0.1s",
          }}
        >
          {/* Sky objects */}
          <div id="skyObjects" className="absolute inset-0 overflow-hidden">
            {isDay && <Sun />}
            {!isDay && <Moon />}
            {isDay && <Clouds />}
            {!isDay && <Stars />}
          </div>

          {/* Hills */}
          <div className="hill1" />
          <div className="hill2" />

          {/* Weather info */}
          <div className="weather">
            <div className="temp" id="weather-temp">
              {loading ? "0°" : "0°"}
            </div>
            <div className="status">
              {loading ? "Загрузка..." : weatherText(current.weather_code)}
            </div>
            <div className="city">Раздельная</div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="section fade" style={{ animationDelay: "0.2s" }}>Сейчас</div>

        {!loading && (
          <div className="grid">
            <div className="card fade" style={{ animationDelay: "0.25s" }}>
              <div className="icon">💧</div>
              <div className="label">Влажность</div>
              <div className="value">{current.relative_humidity_2m ?? "--"}</div>
            </div>
            <div className="card fade" style={{ animationDelay: "0.3s" }}>
              <div className="icon">💨</div>
              <div className="label">Ветер</div>
              <div className="value">{Math.round(current.wind_speed_10m || 0)} км</div>
            </div>
            <div className="card fade" style={{ animationDelay: "0.35s" }}>
              <div className="icon">🌧</div>
              <div className="label">Осадки</div>
              <div className="value">{daily.precipitation_probability_max?.[0] ?? "--"}%</div>
            </div>
            <div className="card fade" style={{ animationDelay: "0.4s" }}>
              <div className="icon">☀️</div>
              <div className="label">UV индекс</div>
              <div className="value">{Math.round(daily.uv_index_max?.[0] || 0)}</div>
            </div>
          </div>
        )}

        {/* Forecast */}
        <div className="section fade" style={{ animationDelay: "0.45s" }}>5 дней</div>

        {!loading && (
          <div className="forecast-wrap">
            {Array.from({ length: 5 }).map((_, i) => {
              const date = new Date(daily.time?.[i] || new Date())
              const dayName = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : days[date.getDay()]
              return (
                <div key={i} className="forecast fade" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
                  <div className="forecast-day">{dayName}</div>
                  <div className="forecast-icon">{weatherIcon(daily.weather_code?.[i])}</div>
                  <div className="forecast-temp">
                    {Math.round(daily.temperature_2m_max?.[i] || 0)}°
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        .fade {
          animation: fadeUp 0.8s ease forwards;
          opacity: 0;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .subtitle {
          font-size: 14px;
          color: #B7B0A8;
          margin-bottom: 8px;
          transition: 0.5s;
        }

        .title {
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 24px;
        }

        .hero {
          position: relative;
          height: 330px;
          border-radius: 34px;
          overflow: hidden;
          margin-bottom: 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          transition: 1.2s ease;
        }

        .sun {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #FFF7B8;
          right: 34px;
          top: 35px;
          box-shadow:
            0 0 30px rgba(255, 245, 170, 0.8),
            0 0 70px rgba(255, 245, 170, 0.5);
          animation: floatSun 4s ease infinite;
        }

        @keyframes floatSun {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }

        .moon {
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: #E8ECFF;
          right: 36px;
          top: 38px;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.35);
        }

        .moon::after {
          content: "";
          position: absolute;
          width: 58px;
          height: 58px;
          background: #1E2B4B;
          border-radius: 50%;
          left: 18px;
          top: 0;
        }

        .hill1 {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 90px;
          background: #FFD2C1;
          border-radius: 50% 50% 0 0;
        }

        .hill2 {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 65px;
          background: #EFC7D8;
          border-radius: 50% 50% 0 0;
        }

        .weather {
          position: absolute;
          left: 24px;
          bottom: 28px;
          z-index: 50;
        }

        .temp {
          font-size: 64px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 6px;
        }

        .status {
          font-size: 22px;
          margin-bottom: 6px;
        }

        .city {
          font-size: 16px;
          color: #666;
          transition: 0.5s;
        }

        .section {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 28px;
        }

        .card {
          background: white;
          padding: 18px;
          border-radius: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          transition: 0.3s;
        }

        .card:active {
          transform: scale(0.97);
        }

        .icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #FFF4E9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          font-size: 20px;
        }

        .label {
          font-size: 14px;
          color: #999;
          margin-bottom: 8px;
        }

        .value {
          font-size: 26px;
          font-weight: 700;
        }

        .forecast-wrap {
          display: flex;
          gap: 12px;
          overflow: auto;
          padding-bottom: 10px;
        }

        .forecast {
          min-width: 90px;
          background: white;
          padding: 18px;
          border-radius: 22px;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
        }

        .forecast-day {
          color: #999;
          margin-bottom: 10px;
        }

        .forecast-icon {
          font-size: 28px;
          margin-bottom: 10px;
        }

        .forecast-temp {
          font-weight: 700;
        }

        /* Night mode overrides */
        .night-mode .subtitle {
          color: #8FA0C0;
        }
        .night-mode .city {
          color: #B0BBD5;
        }
        .night-mode .card {
          background: #202B48;
        }
        .night-mode .icon {
          background: #2B385E;
        }
        .night-mode .label {
          color: #B0BDD9;
        }
        .night-mode .forecast {
          background: #202B48;
        }
        .night-mode .forecast-day {
          color: #B0BDD9;
        }
        .night-mode .hill1 {
          background: #2E3B63;
        }
        .night-mode .hill2 {
          background: #1D2746;
        }
      `}</style>
    </div>
  )
}