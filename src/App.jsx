import { useState, useMemo } from 'react'
import {
  tripDays,
  itineraryForDay,
  expenseTotalsByCategory,
  expenseTotalsByCategoryAndDay,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  formatDate,
  formatCurrency,
} from './data.js'

const CATEGORY_COLORS = {
  lodging: '#8c6a4f',
  food: '#d98e4a',
  entertainment: '#5c8d89',
  travel: '#7a86b8',
}

function Flowchart({ selectedDayId, onSelect }) {
  return (
    <div className="flowchart">
      {tripDays.map((day, i) => (
        <div className="flow-node-wrap" key={day.dayId}>
          {i > 0 && <div className="flow-connector" />}
          <div
            className={`flow-node ${selectedDayId === day.dayId ? 'selected' : ''}`}
            onClick={() => onSelect(day.dayId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(day.dayId)
            }}
          >
            <span className="day-badge">Day {day.dayNumber}</span>
            <div className="frame">
              <img src={day.imageUrl} alt={day.landmark} loading="lazy" />
            </div>
            <div className="city">{day.city}</div>
            <div className="date">{formatDate(day.date)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ItineraryPanel({ day }) {
  const rows = itineraryForDay(day.dayId)
  return (
    <div className="itinerary-panel">
      <h3>{day.city}, {day.country} — Itinerary</h3>
      <p className="itinerary-sub">
        {day.landmark} · {formatDate(day.date)}
      </p>
      <table className="itinerary-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Place</th>
            <th>Activity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.order}>
              <td className="time">{r.time}</td>
              <td className="place">{r.place}</td>
              <td>{r.activity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Donut({ totals, activeCategory, onSelect }) {
  const radius = 90
  const stroke = 26
  const c = 2 * Math.PI * radius
  const total = Object.values(totals).reduce((s, v) => s + v, 0)

  let offset = 0
  const segments = CATEGORY_ORDER.map((cat) => {
    const value = totals[cat] || 0
    const frac = total ? value / total : 0
    const seg = {
      cat,
      value,
      dash: frac * c,
      offset: offset * c,
    }
    offset += frac
    return seg
  })

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 220 220" width="220" height="220" role="img">
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#efe4d3"
          strokeWidth={stroke}
        />
        {total > 0 &&
          segments.map((s) => (
            <circle
              key={s.cat}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={CATEGORY_COLORS[s.cat]}
              strokeWidth={activeCategory === s.cat ? stroke + 8 : stroke}
              strokeDasharray={`${s.dash} ${c - s.dash}`}
              strokeDashoffset={-s.offset}
              transform="rotate(-90 110 110)"
              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
              onClick={() => onSelect(s.cat)}
            />
          ))}
      </svg>
      <div className="donut-center">
        <span className="total-label">Total</span>
        <span className="total-value">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

function Legend({ totals, activeCategory, onSelect }) {
  const total = Object.values(totals).reduce((s, v) => s + v, 0)
  return (
    <ul className="legend">
      {CATEGORY_ORDER.map((cat) => {
        const value = totals[cat] || 0
        const pct = total ? Math.round((value / total) * 100) : 0
        return (
          <li
            key={cat}
            className={activeCategory === cat ? 'active' : ''}
            onClick={() => onSelect(cat)}
          >
            <span className="swatch" style={{ background: CATEGORY_COLORS[cat] }} />
            <span className="name">{CATEGORY_LABELS[cat]}</span>
            <span className="pct">{pct}%</span>
            <span className="amount">{formatCurrency(value)}</span>
          </li>
        )
      })}
    </ul>
  )
}

function CategoryDetail({ category, byCategoryAndDay }) {
  const perDay = byCategoryAndDay[category] || {}
  const max = Math.max(1, ...Object.values(perDay))
  const rows = tripDays.map((d) => ({ day: d, value: perDay[d.dayId] || 0 }))

  return (
    <div className="category-detail">
      <h3>{CATEGORY_LABELS[category]} spending by city</h3>
      <p className="detail-sub">
        How much was spent on {CATEGORY_LABELS[category].toLowerCase()} in each destination
      </p>
      <div className="day-bars">
        {rows.map(({ day, value }) => (
          <div className="day-bar-row" key={day.dayId}>
            <span className="bar-city">{day.city}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(value / max) * 100}%`,
                  background: CATEGORY_COLORS[category],
                }}
              />
            </div>
            <span className="bar-amt">{formatCurrency(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [selectedDayId, setSelectedDayId] = useState(tripDays[0].dayId)
  const [activeCategory, setActiveCategory] = useState('lodging')

  const selectedDay = useMemo(
    () => tripDays.find((d) => d.dayId === selectedDayId),
    [selectedDayId]
  )
  const totals = useMemo(() => expenseTotalsByCategory(), [])
  const byCategoryAndDay = useMemo(() => expenseTotalsByCategoryAndDay(), [])
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)

  return (
    <main className="app">
      <header className="app-header">
        <div className="kicker">Visual Travel Journal</div>
        <h1>10 Cities in 10 Days</h1>
        <p className="subtitle">
          {tripDays[0].city} → {tripDays[tripDays.length - 1].city} ·{' '}
          {formatCurrency(grandTotal)} spent across Europe
        </p>
      </header>

      <section>
        <h2 className="section-title">The Journey</h2>
        <p className="section-desc">
          Ten cities, ten days. Select any stop to reveal that day's itinerary.
        </p>
        <Flowchart selectedDayId={selectedDayId} onSelect={setSelectedDayId} />
        <ItineraryPanel day={selectedDay} />
      </section>

      <section>
        <h2 className="section-title">Expenses</h2>
        <p className="section-desc">
          Overall spending distribution. Select a category to compare across cities.
        </p>
        <div className="expense-layout">
          <Donut totals={totals} activeCategory={activeCategory} onSelect={setActiveCategory} />
          <Legend totals={totals} activeCategory={activeCategory} onSelect={setActiveCategory} />
          <CategoryDetail category={activeCategory} byCategoryAndDay={byCategoryAndDay} />
        </div>
      </section>
    </main>
  )
}