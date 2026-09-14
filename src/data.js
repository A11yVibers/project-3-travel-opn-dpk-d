import Papa from 'papaparse'
import tripDaysRaw from '../project-assets/trip_days.csv?raw'
import itineraryRaw from '../project-assets/itinerary.csv?raw'
import expensesRaw from '../project-assets/expenses.csv?raw'

function parse(raw) {
  return Papa.parse(raw, { header: true, skipEmptyLines: true }).data
}

export const tripDays = parse(tripDaysRaw)
export const itinerary = parse(itineraryRaw)
export const expenses = parse(expensesRaw)

export const CATEGORIES = ['Lodging', 'Food', 'Entertainment', 'Travel']
export const CATEGORY_KEY = {
  Lodging: 'lodging',
  Food: 'food',
  Entertainment: 'entertainment',
  Travel: 'travel',
}