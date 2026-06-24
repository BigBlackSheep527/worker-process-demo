const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year!, month! - 1, day)
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function generateDateRange(start: string, end: string): Date[] {
  const dates: Date[] = []
  const current = parseDate(start)
  const last = parseDate(end)

  while (current <= last) {
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
  const fromDate = parseDate(from)
  const toDate = parseDate(to)
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)
}

export function isToday(date: Date): boolean {
  return formatDateKey(date) === formatDateKey(new Date())
}
