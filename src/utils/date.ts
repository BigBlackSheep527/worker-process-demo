const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

export function parseDateSafe(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function parseDate(dateStr: string): Date {
  return parseDateSafe(dateStr) ?? new Date(NaN)
}

export function isValidDateStr(dateStr: string): boolean {
  return parseDateSafe(dateStr) !== null
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function generateDateRange(start: string, end: string): Date[] {
  const startDate = parseDateSafe(start)
  const endDate = parseDateSafe(end)
  if (!startDate || !endDate || startDate > endDate) return []

  const dates: Date[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function getWeekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()]!
}

export function getMonthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

export function daysBetween(from: string, to: string): number {
  const fromDate = parseDateSafe(from)
  const toDate = parseDateSafe(to)
  if (!fromDate || !toDate) return 0
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)
}

export function isToday(date: Date): boolean {
  return formatDateKey(date) === formatDateKey(new Date())
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function normalizeDateRange(start: string, end: string): [string, string] {
  const startDate = parseDateSafe(start)
  const endDate = parseDateSafe(end)

  if (!startDate && !endDate) return [start, end]
  if (!startDate) return [end, end]
  if (!endDate) return [start, start]
  if (startDate <= endDate) return [start, end]
  return [end, start]
}
