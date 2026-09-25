function parseCSV(text) {
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
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((c) => c !== '')) rows.push(row)
  }

  const [header, ...body] = rows
  return body.map((r) => {
    const obj = {}
    header.forEach((h, idx) => {
      obj[h.trim()] = (r[idx] ?? '').trim()
    })
    return obj
  })
}

async function fetchCSV(name) {
  const res = await fetch(`${import.meta.env.BASE_URL}${name}`)
  if (!res.ok) throw new Error(`Failed to load ${name}`)
  return parseCSV(await res.text())
}

export async function loadTripData() {
  const [tripDays, itinerary, expenses] = await Promise.all([
    fetchCSV('trip_days.csv'),
    fetchCSV('itinerary.csv'),
    fetchCSV('expenses.csv'),
  ])

  tripDays.sort((a, b) => Number(a.day_number) - Number(b.day_number))

  const itineraryByDay = {}
  for (const item of itinerary) {
    const key = item.day_id
    if (!itineraryByDay[key]) itineraryByDay[key] = []
    itineraryByDay[key].push({
      time: item.time,
      place: item.place,
      activity: item.activity,
    })
  }
  for (const key of Object.keys(itineraryByDay)) {
    itineraryByDay[key].sort((a, b) => Number(a.time.replace(':', '')) - Number(b.time.replace(':', '')))
  }

  const expensesByDay = {}
  for (const item of expenses) {
    const key = item.day_id
    if (!expensesByDay[key]) expensesByDay[key] = []
    expensesByDay[key].push({
      category: item.category,
      subcategory: item.subcategory,
      description: item.description,
      amount: Number(item.amount_usd),
    })
  }

  const days = tripDays.map((d) => ({
    id: d.day_id,
    dayNumber: Number(d.day_number),
    date: d.date,
    city: d.city,
    country: d.country,
    landmark: d.iconic_landmark,
    imageUrl: d.landmark_image_url,
    itinerary: itineraryByDay[d.day_id] || [],
    expenses: expensesByDay[d.day_id] || [],
  }))

  return { days }
}