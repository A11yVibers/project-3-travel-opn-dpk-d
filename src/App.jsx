import { useEffect, useMemo, useState } from 'react'
import { loadTripData } from './data.js'

const CATEGORIES = ['lodging', 'food', 'entertainment', 'travel']

const CATEGORY_META = {
  lodging: { label: 'Lodging', color: '#6C5CE7' },
  food: { label: 'Food', color: '#00B894' },
  entertainment: { label: 'Entertainment', color: '#FDCB6E' },
  travel: { label: 'Travel', color: '#E17055' },
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatMoney(n) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function DonutChart({ totalByCategory, total, selectedCategory, onSelect }) {
  const size = 260
  const stroke = 46
  const radius = (size - stroke) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let accumulated = 0
  const slices = CATEGORIES.filter((c) => totalByCategory[c] > 0).map((c) => {
    const value = totalByCategory[c]
    const startAngle = (accumulated / total) * 2 * Math.PI
    accumulated += value
    const endAngle = (accumulated / total) * 2 * Math.PI
    return { c, value, startAngle, endAngle }
  })

  const polarToCartesian = (angle) => {
    return [
      center + radius * Math.cos(angle - Math.PI / 2),
      center + radius * Math.sin(angle - Math.PI / 2),
    ]
  }

  const arcPath = (start, end) => {
    const [sx, sy] = polarToCartesian(end)
    const [ex, ey] = polarToCartesian(start)
    const largeArc = end - start > Math.PI ? 1 : 0
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 0 ${ex} ${ey}`
  }

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#2a2a3a" strokeWidth={stroke} />
        {slices.map((s) => (
          <path
            key={s.c}
            d={arcPath(s.startAngle, s.endAngle)}
            fill="none"
            stroke={CATEGORY_META[s.c].color}
            strokeWidth={stroke}
            className={selectedCategory === s.c ? 'slice active' : 'slice'}
            onClick={() => onSelect(s.c)}
          >
            <title>{CATEGORY_META[s.c].label}</title>
          </path>
        ))}
        <text x={center} y={center - 4} textAnchor="middle" className="donut-center-label">
          {formatMoney(total)}
        </text>
        <text x={center} y={center + 20} textAnchor="middle" className="donut-center-sub">
          total spent
        </text>
      </svg>

      <div className="legend">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`legend-item ${selectedCategory === c ? 'active' : ''}`}
            onClick={() => onSelect(c)}
            style={{ '--legend-color': CATEGORY_META[c].color }}
          >
            <span className="legend-dot" />
            <span className="legend-label">{CATEGORY_META[c].label}</span>
            <span className="legend-value">{formatMoney(totalByCategory[c])}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BarComparison({ days, category, onClear }) {
  const values = days.map((d) => {
    const total = d.expenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0)
    return { day: d, total }
  })
  const max = Math.max(...values.map((v) => v.total), 1)

  return (
    <div className="comparison-panel">
      <div className="comparison-header">
        <h3>
          {CATEGORY_META[category].label} — spend per city
        </h3>
        <button className="clear-btn" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="bars">
        {values.map(({ day, total }) => (
          <div className="bar-row" key={day.id}>
            <span className="bar-city">{day.city}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(total / max) * 100}%`,
                  background: CATEGORY_META[category].color,
                }}
              />
            </div>
            <span className="bar-value">{formatMoney(total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function JourneyNode({ day, index, isSelected, onSelect, isLast }) {
  return (
    <div className="node-container">
      <button
        className={`journey-node ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(day.id)}
      >
        <span className="node-frame">
          <span
            className="node-image"
            style={{ backgroundImage: `url(${day.imageUrl})` }}
            role="img"
            aria-label={day.landmark}
          />
        </span>
        <span className="node-caption">
          <span className="node-city">{day.city}</span>
          <span className="node-date">{formatDate(day.date)}</span>
        </span>
      </button>
      {!isLast && <span className="node-connector" />}
    </div>
  )
}

export default function App() {
  const [days, setDays] = useState(null)
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTripData()
      .then(({ days }) => {
        setDays(days)
        setSelectedDay(days[0]?.id || null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalByCategory = useMemo(() => {
    if (!days) return {}
    const totals = { lodging: 0, food: 0, entertainment: 0, travel: 0 }
    for (const day of days) {
      for (const e of day.expenses) {
        totals[e.category] = (totals[e.category] || 0) + e.amount
      }
    }
    return totals
  }, [days])

  const grandTotal = useMemo(
    () => Object.values(totalByCategory).reduce((a, b) => a + b, 0),
    [totalByCategory],
  )

  const activeDay = days?.find((d) => d.id === selectedDay) || null

  if (loading) return <main className="app"><p className="loading">Loading your journey…</p></main>
  if (error) return <main className="app"><p className="error">Could not load trip data: {error}</p></main>

  return (
    <main className="app">
      <header className="hero">
        <h1 className="title">Europe in Ten Days</h1>
        <p className="subtitle">One city a day · June 1–10, 2026</p>
      </header>

      <section className="section journey-section">
        <h2 className="section-title">The Journey</h2>
        <p className="section-note">Select a city to view its itinerary.</p>
        <div className="journey-flow">
          {days.map((day, i) => (
            <JourneyNode
              key={day.id}
              day={day}
              index={i}
              isLast={i === days.length - 1}
              isSelected={selectedDay === day.id}
              onSelect={setSelectedDay}
            />
          ))}
        </div>
      </section>

      {activeDay && (
        <section className="section itinerary-section" id="itinerary">
          <h2 className="section-title">
            {activeDay.city} <span className="muted">— Day {activeDay.dayNumber}</span>
          </h2>
          <table className="itinerary-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Place</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {activeDay.itinerary.map((item, i) => (
                <tr key={i}>
                  <td className="cell-time">{item.time}</td>
                  <td>{item.place}</td>
                  <td>{item.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="section expense-section">
        <h2 className="section-title">Expenses</h2>
        <p className="section-note">Select a category to compare spending across cities.</p>
        <DonutChart
          totalByCategory={totalByCategory}
          total={grandTotal}
          selectedCategory={selectedCategory}
          onSelect={(c) => setSelectedCategory((prev) => (prev === c ? null : c))}
        />
        {selectedCategory && (
          <BarComparison
            days={days}
            category={selectedCategory}
            onClear={() => setSelectedCategory(null)}
          />
        )}
      </section>

      <footer className="footer">
        <p>Images sourced from Wikimedia Commons.</p>
      </footer>
    </main>
  )
}