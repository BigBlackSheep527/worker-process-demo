<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import type { StoryWithLane, Worker } from '../api/types/worker'
import {
  formatDateKey,
  generateDateRange,
  getWeekdayLabel,
  isToday,
  isWeekend,
} from '../utils/date'
import {
  assignLanes,
  COLOR_PROGRESS_DONE,
  COLOR_PROGRESS_TODO,
  DAY_WIDTH,
  formatProgressLabel,
  getBarStyle,
  getLaneCount,
  getProgressPercent,
  getRowHeight,
  groupDatesByMonth,
  HEADER_HEIGHT,
  isStoryInRange,
  isStoryValid,
  SIDEBAR_WIDTH,
} from '../utils/gantt'

const props = defineProps<{
  workers: Worker[]
  selectedMembers: number[]
  startDate: string
  endDate: string
}>()

const headerScrollRef = ref<HTMLElement | null>(null)
const sidebarScrollRef = ref<HTMLElement | null>(null)
const mainScrollRef = ref<HTMLElement | null>(null)
const hoveredRowId = ref<number | null>(null)
const hoveredDateKey = ref<string | null>(null)

const COLLAPSE_LIMIT = 3
const expandedWorkers = ref<Set<number>>(new Set())

const dateRange = computed(() => generateDateRange(props.startDate, props.endDate))
const monthGroups = computed(() => groupDatesByMonth(dateRange.value))
const timelineWidth = computed(() =>
  Math.max(dateRange.value.length * DAY_WIDTH, DAY_WIDTH),
)

const filteredWorkers = computed(() => {
  if (props.selectedMembers.length === 0) return props.workers
  return props.workers.filter((worker) =>
    props.selectedMembers.includes(worker.user_id),
  )
})

watch(
  () => [props.selectedMembers, props.startDate, props.endDate],
  () => {
    expandedWorkers.value = new Set()
    hoveredRowId.value = null
    hoveredDateKey.value = null
  },
  { deep: true },
)

function isWorkerExpanded(userId: number): boolean {
  return expandedWorkers.value.has(userId)
}

function toggleWorkerExpand(userId: number) {
  const next = new Set(expandedWorkers.value)
  if (next.has(userId)) {
    next.delete(userId)
  } else {
    next.add(userId)
  }
  expandedWorkers.value = next
}

interface WorkerRow {
  worker: Worker
  stories: StoryWithLane[]
  laneCount: number
  rowHeight: number
  totalCount: number
  canCollapse: boolean
  isExpanded: boolean
  hiddenCount: number
}

const workerRows = computed<WorkerRow[]>(() =>
  filteredWorkers.value.map((worker) => {
    const storiesInRange = worker.stories
      .filter(
        (story) =>
          isStoryValid(story) &&
          isStoryInRange(story, props.startDate, props.endDate),
      )
      .sort(
        (a, b) =>
          new Date(a.expect_start_at).getTime() -
          new Date(b.expect_start_at).getTime(),
      )

    const totalCount = storiesInRange.length
    const canCollapse = totalCount > COLLAPSE_LIMIT
    const isExpanded = isWorkerExpanded(worker.user_id)
    const visibleStories =
      canCollapse && !isExpanded
        ? storiesInRange.slice(0, COLLAPSE_LIMIT)
        : storiesInRange
    const stories = assignLanes(visibleStories)
    const laneCount = getLaneCount(stories)

    return {
      worker,
      stories,
      laneCount,
      rowHeight: getRowHeight(laneCount),
      totalCount,
      canCollapse,
      isExpanded,
      hiddenCount: totalCount - COLLAPSE_LIMIT,
    }
  }),
)

function onMainScroll() {
  const main = mainScrollRef.value
  if (!main) return

  if (headerScrollRef.value) {
    headerScrollRef.value.scrollLeft = main.scrollLeft
  }
  if (sidebarScrollRef.value) {
    sidebarScrollRef.value.scrollTop = main.scrollTop
  }
}

function setHoveredRow(userId: number | null) {
  hoveredRowId.value = userId
}

function setHoveredDate(dateKey: string | null) {
  hoveredDateKey.value = dateKey
}

function isColHovered(date: Date): boolean {
  return hoveredDateKey.value === formatDateKey(date)
}

function isRowHovered(userId: number): boolean {
  return hoveredRowId.value === userId
}
</script>

<template>
  <div class="gantt">
    <div v-if="dateRange.length === 0" class="gantt-empty">
      请选择有效的日期范围
    </div>

    <div v-else-if="workerRows.length === 0" class="gantt-empty">
      暂无符合条件的成员数据
    </div>

    <div
      v-else
      class="gantt-grid"
      :style="{
        gridTemplateColumns: `${SIDEBAR_WIDTH}px 1fr`,
        gridTemplateRows: `${HEADER_HEIGHT}px 1fr`,
      }"
    >
      <div class="gantt-corner">成员</div>

      <div ref="headerScrollRef" class="gantt-header-scroll">
        <div class="gantt-header-inner" :style="{ width: `${timelineWidth}px` }">
          <div class="gantt-month-row">
            <div
              v-for="(group, index) in monthGroups"
              :key="`${group.label}-${index}`"
              class="gantt-month-cell"
              :style="{ width: `${group.span * DAY_WIDTH}px` }"
            >
              {{ group.label }}
            </div>
          </div>

          <div class="gantt-day-row">
            <div
              v-for="date in dateRange"
              :key="`day-${formatDateKey(date)}`"
              class="gantt-day-cell"
              :class="{
                'is-today': isToday(date),
                'is-weekend': isWeekend(date),
                'is-col-hovered': isColHovered(date),
              }"
              :style="{ width: `${DAY_WIDTH}px` }"
              @mouseenter="setHoveredDate(formatDateKey(date))"
              @mouseleave="setHoveredDate(null)"
            >
              {{ date.getDate() }}
            </div>
          </div>

          <div class="gantt-weekday-row">
            <div
              v-for="date in dateRange"
              :key="`weekday-${formatDateKey(date)}`"
              class="gantt-day-cell"
              :class="{
                'is-today': isToday(date),
                'is-weekend': isWeekend(date),
                'is-col-hovered': isColHovered(date),
              }"
              :style="{ width: `${DAY_WIDTH}px` }"
              @mouseenter="setHoveredDate(formatDateKey(date))"
              @mouseleave="setHoveredDate(null)"
            >
              {{ getWeekdayLabel(date) }}
            </div>
          </div>
        </div>
      </div>

      <div ref="sidebarScrollRef" class="gantt-sidebar-scroll">
        <div
          v-for="row in workerRows"
          :key="row.worker.user_id"
          class="gantt-sidebar-row"
          :class="{ 'is-row-hovered': isRowHovered(row.worker.user_id) }"
          :style="{ height: `${row.rowHeight}px` }"
          @mouseenter="setHoveredRow(row.worker.user_id)"
          @mouseleave="setHoveredRow(null)"
        >
          <div class="worker-info">
            <div class="worker-name">{{ row.worker.name }}</div>
            <div class="worker-position">{{ row.worker.position }}</div>
          </div>
          <el-icon
            v-if="row.canCollapse"
            class="collapse-icon"
            :class="{ expanded: row.isExpanded }"
            @click.stop="toggleWorkerExpand(row.worker.user_id)"
          >
            <ArrowDown />
          </el-icon>
        </div>
      </div>

      <div ref="mainScrollRef" class="gantt-main-scroll" @scroll="onMainScroll">
        <div class="gantt-main-inner" :style="{ width: `${timelineWidth}px` }">
          <div
            v-for="row in workerRows"
            :key="`timeline-${row.worker.user_id}`"
            class="gantt-row"
            :class="{ 'is-row-hovered': isRowHovered(row.worker.user_id) }"
            :style="{ height: `${row.rowHeight}px` }"
            @mouseenter="setHoveredRow(row.worker.user_id)"
            @mouseleave="setHoveredRow(null)"
          >
            <div
              v-for="date in dateRange"
              :key="`grid-${row.worker.user_id}-${formatDateKey(date)}`"
              class="gantt-grid-cell"
              :class="{
                'is-today': isToday(date),
                'is-weekend': isWeekend(date),
                'is-col-hovered': isColHovered(date),
              }"
              :style="{ width: `${DAY_WIDTH}px` }"
              @mouseenter="setHoveredDate(formatDateKey(date))"
              @mouseleave="setHoveredDate(null)"
            />

            <el-tooltip
              v-for="story in row.stories"
              :key="story.story_id"
              :content="formatProgressLabel(story.progress, story.title)"
              placement="top"
              :show-after="200"
            >
              <div
                v-if="getBarStyle(story, startDate, endDate, DAY_WIDTH)"
                class="gantt-bar"
                :style="getBarStyle(story, startDate, endDate, DAY_WIDTH)!"
              >
                <div
                  class="gantt-bar-progress"
                  :style="{
                    width: `${getProgressPercent(story.progress)}%`,
                    backgroundColor: COLOR_PROGRESS_DONE,
                  }"
                />
                <div
                  class="gantt-bar-remain"
                  :style="{ backgroundColor: COLOR_PROGRESS_TODO }"
                />
                <span class="gantt-bar-label">
                  {{ formatProgressLabel(story.progress, story.title) }}
                </span>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt {
  flex: 1;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.gantt-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 240px;
  color: #999;
  font-size: 14px;
}

.gantt-grid {
  display: grid;
  height: 100%;
  max-height: calc(100vh - 180px);
  overflow: hidden;
}

.gantt-corner {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  box-sizing: border-box;
  z-index: 3;
}

.gantt-header-scroll {
  overflow: hidden;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  z-index: 2;
}

.gantt-header-inner {
  min-width: 100%;
}

.gantt-sidebar-scroll {
  overflow: hidden;
  border-right: 1px solid #e8e8e8;
  background: #fafafa;
  z-index: 2;
}

.gantt-main-scroll {
  overflow: auto;
  background: #fff;
}

.gantt-main-inner {
  min-width: 100%;
}

.gantt-month-row,
.gantt-day-row,
.gantt-weekday-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.gantt-month-row {
  height: 28px;
}

.gantt-day-row {
  height: 24px;
}

.gantt-weekday-row {
  height: 20px;
}

.gantt-month-cell,
.gantt-day-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  border-right: 1px solid #f0f0f0;
  box-sizing: border-box;
  flex-shrink: 0;
}

.gantt-sidebar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
  transition: background-color 0.15s;
}

.gantt-sidebar-row.is-row-hovered,
.gantt-row.is-row-hovered {
  background: #f5f7fa;
}

.worker-info {
  min-width: 0;
  flex: 1;
}

.worker-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.worker-position {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.collapse-icon {
  flex-shrink: 0;
  font-size: 14px;
  color: #11aa66;
  cursor: pointer;
  transition: transform 0.2s;
}

.collapse-icon.expanded {
  transform: rotate(180deg);
}

.gantt-row {
  position: relative;
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
  transition: background-color 0.15s;
}

.gantt-grid-cell {
  height: 100%;
  border-right: 1px solid #f0f0f0;
  box-sizing: border-box;
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.gantt-day-cell.is-today,
.gantt-grid-cell.is-today {
  background: #e6f7ff;
}

.gantt-day-cell.is-weekend,
.gantt-grid-cell.is-weekend {
  background: #fafafa;
}

.gantt-day-cell.is-col-hovered,
.gantt-grid-cell.is-col-hovered {
  background: #edf6ff;
}

.gantt-day-cell.is-today.is-col-hovered,
.gantt-grid-cell.is-today.is-col-hovered {
  background: #d6efff;
}

.gantt-bar {
  position: absolute;
  border-radius: 4px;
  overflow: hidden;
  cursor: default;
  box-sizing: border-box;
  z-index: 1;
}

.gantt-bar:hover {
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.gantt-bar-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1;
}

.gantt-bar-remain {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.gantt-bar-label {
  position: relative;
  z-index: 2;
  display: block;
  color: #fff;
  font-size: 12px;
  line-height: 24px;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: none;
}
</style>
