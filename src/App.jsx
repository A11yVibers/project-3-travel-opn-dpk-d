import { useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { tripDays, itinerary, expenses, CATEGORIES, CATEGORY_KEY } from './data.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const numRows = tripDays.length

const expensesByDay = {}
for (const day of tripDays) {
  expensesByDay[day.day_id] = []
}
for (const e of expenses) {
  if (expensesByDay[e.day_id]) expensesByDay[e.day_id].push(e)
}

const itineraryByDay = {}
for (const row of itinerary) {
  ;(itineraryByDay[row.day_id] ??= []).push(row)
}
for (const key of Object.keys(itineraryByDay)) {
  itineraryByDay[key].sort((a, b) => Number(a.item_order) - Number(b.item_order))
}

function FlowNode({ day, index, selected, onSelect }) {
  const even = index % 2 === 0
  return (
    <div className={'flow-col' + (even ? '' : ' offset')}>
      <button
        className={'node ' + (selected ? 'selected' : '')}
        onClick={() => onSelect(day.day_id)}
        title={day.iconic_landmark}
      >
        <div className={'frame ' + (even ? 'diamond' : 'circle')}>
          <img
            src={day.landmark_image_url}
            alt={day.iconic_landmark}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling.style.display = 'flex'
            }}
          />
          <span className="frame-fallback" style={{ display: 'none' }}>
            {day.city[0]}
          </span>
        </div>
        <div className="node-label">
          <span className="city">{day.city}</span>
          <span className="date">{day.date}</span>
        </div>
      </button>
    </div>
  )
}

function ItineraryTable({ day }) {
  const rows = itineraryByDay[day.day_id] ?? []
  return (
    <div className="itinerary">
      <h3>{day.city} — Itinerary</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Place</th>
            <th>Activity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.time}</td>
              <td>{r.place}</td>
              <td>{r.activity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)

  const day = tripDays.find((d) => d.day_id === selectedDay)

  const totals = CATEGORIES.reduce((acc, label) => {
    acc[label] = 0
    return acc
  }, {})
  for (const key of Object.keys(expensesByDay)) {
    for (const e of expensesByDay[key]) {
      const label = Object.keys(CATEGORY_KEY).find(
        (k) => CATEGORY_KEY[k] === e.category
      )
      if (label) totals[label] += Number(e.amount_usd)
    }
  }

  const pieData = {
    labels: CATEGORIES,
    datasets: [
      {
        data: CATEGORIES.map((c) => totals[c]),
        backgroundColor: ['#e76f51', '#f4a261', '#2a9d8f', '#577590'],
        hoverOffset: 12,
      },
    ],
  }

  const barData = selectedCat
    ? {
        labels: tripDays.map((d) => d.city),
        datasets: [
          {
            label: selectedCat,
            data: tripDays.map((d) => {
              const key = CATEGORY_KEY[selectedCat]
              return expensesByDay[d.day_id]
                .filter((e) => e.category === key)
                .reduce((s, e) => s + Number(e.amount_usd), 0)
            }),
            backgroundColor: '#2a9d8f',
          },
        ],
      }
    : null

  return (
    <main>
      <header>
        <h1>European Journey</h1>
        <p>10 days · 10 cities</p>
      </header>

      <section className="flowchart">
        <h2>Journey Flow</h2>
        <div className="flow">
          {tripDays.map((d, i) => (
            <FlowNode
              key={d.day_id}
              day={d}
              index={i}
              selected={selectedDay === d.day_id}
              onSelect={setSelectedDay}
            />
          ))}
        </div>
        {day && <ItineraryTable day={day} />}
      </section>

      <section className="expenses">
        <h2>Spending Distribution</h2>
        <div className="expenses-grid">
          <div className="pie-wrap">
            <Pie
              data={pieData}
              options={{
                maintainAspectRatio: false,
                onClick: (_, elements) => {
                  if (elements.length > 0) {
                    setSelectedCat(CATEGORIES[elements[0].index])
                  } else {
                    setSelectedCat(null)
                  }
                },
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </div>
          <div className="detail">
            {selectedCat ? (
              <>
                <h3>{selectedCat} by city</h3>
                <Bar
                  data={barData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                  }}
                />
              </>
            ) : (
              <p className="hint">Select a slice to compare spending by city.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}