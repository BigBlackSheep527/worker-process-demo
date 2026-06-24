<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StoryWithLane, Worker } from '../api/types/worker'
import {
  formatDateKey,
  generateDateRange,
  getWeekdayLabel,
  isToday,
} from '../utils/date'
import {
  assignLanes,
  DAY_WIDTH,
  formatProgressLabel,
  getBarColor,
  getBarStyle,
  getLaneCount,
  getRowHeight,
  groupDatesByMonth,
  isStoryInRange,
  SIDEBAR_WIDTH,
} from '../utils/gantt'

const props = defineProps<{
  workers: Worker[]
  selectedMember: number | ''
  startDate: string
  endDate: string
}>()

const dateRange = computed(() => generateDateRange(props.startDate, props.endDate))
const monthGroups = computed(() => groupDatesByMonth(dateRange.value))
const timelineWidth = computed(() => dateRange.value.length * DAY_WIDTH)

const filteredWorkers = computed(() => {
  if (props.selectedMember === '') return props.workers
  return props.workers.filter((worker) => worker.user_id === props.selectedMember)
})

const COLLAPSE_LIMIT = 3
const expandedWorkers = ref<Set<number>>(new Set())

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
      .filter((story) => isStoryInRange(story, props.startDate, props.endDate))
      .sort(
        (a, b) =>
          new Date(a.expect_start_at).getTime() - new Date(b.expect_start_at).getTime(),
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

</script>

<template>
  <div class="gantt">
    <div class="gantt-layout">
      <div class="gantt-sidebar" :style="{ width: `${SIDEBAR_WIDTH}px` }">
        <div class="gantt-sidebar-header gantt-header-cell">成员</div>
        <div
          v-for="row in workerRows"
          :key="row.worker.user_id"
          class="gantt-sidebar-row"
          :style="{ height: `${row.rowHeight}px` }"
        >
          <div class="worker-info">
            <div class="worker-name">{{ row.worker.name }}</div>
            <div class="worker-position">{{ row.worker.position }}</div>
          </div>
          <svg   v-if="row.canCollapse"
            @click="toggleWorkerExpand(row.worker.user_id)" t="1782287168856" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1663" width="15" height="15"><path d="M0 0h1024v1024H0V0z" fill="#202425" opacity=".01" p-id="1664"></path><path d="M901.597867 293.0688a68.266667 68.266667 0 0 1 0 96.529067l-341.333334 341.333333a68.266667 68.266667 0 0 1-96.529066 0l-341.333334-341.333333a68.266667 68.266667 0 1 1 96.529067-96.529067L512 586.1376l293.0688-293.0688a68.266667 68.266667 0 0 1 96.529067 0z" fill="#11AA66" p-id="1665"></path></svg>
        </div>
      </div>

      <div class="gantt-timeline">
        <div class="gantt-scroll">
          <div class="gantt-scroll-inner" :style="{ width: `${timelineWidth}px` }">
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
                :key="formatDateKey(date)"
                class="gantt-day-cell"
                :class="{ 'is-today': isToday(date) }"
                :style="{ width: `${DAY_WIDTH}px` }"
              >
                {{ date.getDate() }}
              </div>
            </div>

            <div class="gantt-weekday-row">
              <div
                v-for="date in dateRange"
                :key="`weekday-${formatDateKey(date)}`"
                class="gantt-day-cell"
                :class="{ 'is-today': isToday(date) }"
                :style="{ width: `${DAY_WIDTH}px` }"
              >
                {{ getWeekdayLabel(date) }}
              </div>
            </div>

            <div
              v-for="row in workerRows"
              :key="`timeline-${row.worker.user_id}`"
              class="gantt-row"
              :style="{ height: `${row.rowHeight}px`, width: `${timelineWidth}px` }"
            >
              <div
                v-for="date in dateRange"
                :key="`grid-${row.worker.user_id}-${formatDateKey(date)}`"
                class="gantt-grid-cell"
                :class="{ 'is-today': isToday(date) }"
                :style="{ width: `${DAY_WIDTH}px` }"
              />

              <el-tooltip
                v-for="story in row.stories"
                :key="story.story_id"
                :content="formatProgressLabel(story.progress, story.title)"
                placement="top"
                :show-after="200"
              >
                <div
                  class="gantt-bar"
                  :style="{
                    ...getBarStyle(story, startDate, DAY_WIDTH),
                    backgroundColor: getBarColor(story.progress),
                  }"
                >
                  {{ formatProgressLabel(story.progress, story.title) }}
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt {
  flex: 1;
  overflow: hidden;
  background: #fff;
}

.gantt-layout {
  display: flex;
  height: 100%;
  border: 1px solid #e8e8e8;
}

.gantt-sidebar {
  flex-shrink: 0;
  border-right: 1px solid #e8e8e8;
  background: #fafafa;
}

.gantt-sidebar-header,
.gantt-header-cell {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #e8e8e8;
  box-sizing: border-box;
}

.gantt-sidebar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px 0 16px;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.worker-info {
  min-width: 0;
  flex: 1;
}

.collapse-btn {
  flex-shrink: 0;
  padding: 2px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #1890ff;
  font-size: 12px;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
}

.collapse-btn:hover {
  color: #40a9ff;
  border-color: #40a9ff;
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

.gantt-timeline {
  flex: 1;
  overflow: hidden;
}

.gantt-scroll {
  overflow: auto;
  height: 100%;
  max-height: calc(100vh - 180px);
}

.gantt-scroll-inner {
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
  background: #fafafa;
}

.gantt-day-row {
  height: 24px;
}

.gantt-weekday-row {
  height: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.gantt-month-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  border-right: 1px solid #f0f0f0;
  box-sizing: border-box;
  flex-shrink: 0;
}

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

.gantt-day-cell.is-today,
.gantt-grid-cell.is-today {
  background: #e6f7ff;
}

.gantt-row {
  position: relative;
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.gantt-grid-cell {
  height: 100%;
  border-right: 1px solid #f0f0f0;
  box-sizing: border-box;
  flex-shrink: 0;
}

.gantt-bar {
  position: absolute;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  line-height: 24px;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: default;
  box-sizing: border-box;
  z-index: 1;
}

.gantt-bar:hover {
  filter: brightness(1.05);
  z-index: 2;
}
</style>
