<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getWorkerData } from './api/getWorkerData'
import Header from './components/Header.vue'
import WorkerTable from './components/WorkerTable.vue'
import type { Worker } from './api/types/worker'

const activeTab = ref('stats')
const selectedMember = ref<number | ''>('')
const dateRange = ref<[string, string]>(['2024-09-01', '2024-10-29'])
const workers = ref<Worker[]>([])

onMounted(async () => {
  const res = await getWorkerData()
  workers.value = res.data ?? []
})
</script>

<template>
  <div class="oa-app">
    <Header
      v-model:active-tab="activeTab"
      :workers="workers"
      :selected-member="selectedMember"
      :date-range="dateRange"
      @update:selected-member="selectedMember = $event"
      @update:date-range="dateRange = $event"
    />
    <div v-if="activeTab === 'stats'" class="gantt-wrapper">
      <WorkerTable
        :workers="workers"
        :selected-member="selectedMember"
        :start-date="dateRange[0]"
        :end-date="dateRange[1]"
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
  background: #f5f5f5;
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
