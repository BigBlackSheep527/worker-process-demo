import type { MonthGroup, Story, StoryWithLane } from '../api/types/worker'
import { getMonthLabel } from './date'

export const DAY_WIDTH = 40
export const SIDEBAR_WIDTH = 180
export const BAR_HEIGHT = 24
export const BAR_GAP = 4
export const ROW_PADDING = 8

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

export function isStoryInRange(story: Story, start: string, end: string): boolean {
  return story.expect_start_at <= end && story.expect_end_at >= start
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
  dayWidth: number,
): Record<string, string> {
  const startOffset = daysBetween(rangeStart, story.expect_start_at)
  const endOffset = daysBetween(rangeStart, story.expect_end_at)
  const top = ROW_PADDING + story.lane * (BAR_HEIGHT + BAR_GAP)

  return {
    left: `${startOffset * dayWidth}px`,
    width: `${(endOffset - startOffset + 1) * dayWidth}px`,
    top: `${top}px`,
    height: `${BAR_HEIGHT}px`,
  }
}

export function getBarColor(progress: number): string {
  if (progress >= 1) return '#52c41a'
  if (progress >= 0.8) return '#73d13d'
  return '#fa8c16'
}

export function formatProgressLabel(progress: number, title: string): string {
  return `${Math.round(progress * 100)}% ${title}`
}

function daysBetween(from: string, to: string): number {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  fromDate.setHours(0, 0, 0, 0)
  toDate.setHours(0, 0, 0, 0)
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000)
}
