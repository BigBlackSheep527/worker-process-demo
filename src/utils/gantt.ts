import type { MonthGroup, Story, StoryWithLane } from '../api/types/worker'
import { daysBetween, getMonthLabel, isValidDateStr } from './date'

export const DAY_WIDTH = 40
export const SIDEBAR_WIDTH = 140
export const BAR_HEIGHT = 24
export const BAR_GAP = 4
export const ROW_PADDING = 8
export const HEADER_HEIGHT = 72

export const COLOR_PROGRESS_DONE = '#52c41a'
export const COLOR_PROGRESS_TODO = '#fa8c16'

export function groupDatesByMonth(dates: Date[]): MonthGroup[] {
  const groups: MonthGroup[] = []

  for (const date of dates) {
    const label = getMonthLabel(date)
    const last = groups[groups.length - 1]

    if (last && last.label === label) {
      last.span += 1
    } else {
      groups.push({ label, span: 1 })
    }
  }

  return groups
}

export function isStoryValid(story: Story): boolean {
  return (
    isValidDateStr(story.expect_start_at) &&
    isValidDateStr(story.expect_end_at) &&
    story.expect_start_at <= story.expect_end_at
  )
}

export function isStoryInRange(story: Story, start: string, end: string): boolean {
  if (!isStoryValid(story)) return false
  return story.expect_start_at <= end && story.expect_end_at >= start
}

export function getVisibleStoryRange(
  story: Story,
  rangeStart: string,
  rangeEnd: string,
): { start: string; end: string } | null {
  if (!isStoryInRange(story, rangeStart, rangeEnd)) return null

  const start =
    story.expect_start_at < rangeStart ? rangeStart : story.expect_start_at
  const end = story.expect_end_at > rangeEnd ? rangeEnd : story.expect_end_at

  if (start > end) return null
  return { start, end }
}

export function assignLanes(stories: Story[]): StoryWithLane[] {
  if (stories.length === 0) return []

  const sorted = [...stories].sort(
    (a, b) =>
      new Date(a.expect_start_at).getTime() - new Date(b.expect_start_at).getTime(),
  )
  const lanes: Story[][] = []

  for (const story of sorted) {
    let placed = false

    for (const lane of lanes) {
      const last = lane[lane.length - 1]!
      if (new Date(story.expect_start_at) > new Date(last.expect_end_at)) {
        lane.push(story)
        placed = true
        break
      }
    }

    if (!placed) lanes.push([story])
  }

  return lanes.flatMap((lane, laneIndex) =>
    lane.map((story) => ({ ...story, lane: laneIndex })),
  )
}

export function getLaneCount(stories: StoryWithLane[]): number {
  if (stories.length === 0) return 1
  return Math.max(...stories.map((story) => story.lane + 1))
}

export function getRowHeight(laneCount: number): number {
  return ROW_PADDING * 2 + laneCount * BAR_HEIGHT + (laneCount - 1) * BAR_GAP
}

export function getBarStyle(
  story: StoryWithLane,
  rangeStart: string,
  rangeEnd: string,
  dayWidth: number,
): Record<string, string> | null {
  const visibleRange = getVisibleStoryRange(story, rangeStart, rangeEnd)
  if (!visibleRange) return null

  const startOffset = daysBetween(rangeStart, visibleRange.start)
  const endOffset = daysBetween(rangeStart, visibleRange.end)
  const top = ROW_PADDING + story.lane * (BAR_HEIGHT + BAR_GAP)

  return {
    left: `${startOffset * dayWidth}px`,
    width: `${(endOffset - startOffset + 1) * dayWidth}px`,
    top: `${top}px`,
    height: `${BAR_HEIGHT}px`,
  }
}

export function getProgressPercent(progress: number): number {
  return Math.min(100, Math.max(0, Math.round(progress * 100)))
}

export function formatProgressLabel(progress: number, title: string): string {
  return `${getProgressPercent(progress)}% ${title}`
}
