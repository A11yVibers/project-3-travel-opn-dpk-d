import tripDaysRaw from '../project-assets/trip_days.csv?raw'
import itineraryRaw from '../project-assets/itinerary.csv?raw'
import expensesRaw from '../project-assets/expenses.csv?raw'

function parseCsv(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field)
        field = ''
      } else if (ch === '\n') {
        row.push(field)
        field = ''
        rows.push(row)
        row = []
      } else if (ch !== '\r') {
        field += ch
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const filtered = rows.filter((r) => r.length > 1 || r[0] !== '')
  const headers = filtered[0].map((h) => h.trim())
  return filtered.slice(1).map((r) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? r[idx].trim() : ''
    })
    return obj
  })
}

export const tripDays = parseCsv(tripDaysRaw).map((d) => ({
  dayId: d.day_id,
  dayNumber: parseInt(d.day_number, 10),
  date: d.date,
  city: d.city,
  country: d.country,
  landmark: d.iconic_landmark,
  imageUrl: d.landmark_image_url,
}))

export const itinerary = parseCsv(itineraryRaw).map((i) => ({
  dayId: i.day_id,
  order: parseInt(i.item_order, 10),
  time: i.time,
  place: i.place,
  activity: i.activity,
}))

export const expenses = parseCsv(expensesRaw).map((e) => ({
  dayId: e.day_id,
  order: parseInt(e.expense_order, 10),
  category: e.category,
  subcategory: e.subcategory,
  description: e.description,
  amount: parseFloat(e.amount_usd),
}))

export const CATEGORY_LABELS = {
  lodging: 'Lodging',
  food: 'Food',
  entertainment: 'Entertainment',
  travel: 'Travel',
}

export const CATEGORY_ORDER = ['lodging', 'food', 'entertainment', 'travel']

export function itineraryForDay(dayId) {
  return itinerary
    .filter((i) => i.dayId === dayId)
    .sort((a, b) => a.order - b.order)
}

export function expenseTotalsByCategory() {
  const totals = {}
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount
  })
  return totals
}

export function expenseTotalsByCategoryAndDay() {
  const result = {}
  expenses.forEach((e) => {
    if (!result[e.category]) result[e.category] = {}
    result[e.category][e.dayId] = (result[e.category][e.dayId] || 0) + e.amount
  })
  return result
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10))
  return dateFormatter.format(new Date(y, m - 1, d))
}

export function formatCurrency(n) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}