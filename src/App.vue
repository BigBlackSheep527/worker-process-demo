<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getWorkerData } from './api/getWorkerData'
import Header from './components/Header.vue'
import WorkerTable from './components/WorkerTable.vue'
import type { Worker } from './api/types/worker'
import { DEFAULT_END_DATE, DEFAULT_START_DATE } from './constants/filters'
import { normalizeDateRange } from './utils/date'

const activeTab = ref('stats')
const selectedMembers = ref<number[]>([])
const startDate = ref(DEFAULT_START_DATE)
const endDate = ref(DEFAULT_END_DATE)
const workers = ref<Worker[]>([])
const filterKey = ref(0)

onMounted(async () => {
  const res = await getWorkerData()
  workers.value = res.data ?? []
})

watch([startDate, endDate], ([start, end]) => {
  const [normalizedStart, normalizedEnd] = normalizeDateRange(start, end)
  if (normalizedStart !== start) startDate.value = normalizedStart
  if (normalizedEnd !== end) endDate.value = normalizedEnd
})

function resetFilters() {
  selectedMembers.value = []
  startDate.value = DEFAULT_START_DATE
  endDate.value = DEFAULT_END_DATE
  filterKey.value += 1
}
</script>

<template>
  <div class="oa-app">
    <Header
      v-model:active-tab="activeTab"
      :workers="workers"
      :selected-members="selectedMembers"
      :start-date="startDate"
      :end-date="endDate"
      @update:selected-members="selectedMembers = $event"
      @update:start-date="startDate = $event"
      @update:end-date="endDate = $event"
      @reset="resetFilters"
    />
    <div v-if="activeTab === 'stats'" class="gantt-wrapper">
      <WorkerTable
        :key="filterKey"
        :workers="workers"
        :selected-members="selectedMembers"
        :start-date="startDate"
        :end-date="endDate"
      />
    </div>
    <div v-else class="placeholder">
      <p>{{ activeTab === 'requirements' ? '需求' : '任务' }}页面待开发</p>
    </div>
  </div>
</template>

<style scoped>
.oa-app {
  width: 100%;
  min-height: 100vh;
  text-align: left;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.gantt-wrapper {
  flex: 1;
  padding: 16px 24px 24px;
  overflow: hidden;
  box-sizing: border-box;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}
</style>
