<script setup lang="ts">
import type { Worker } from '../api/types/worker'

const props = defineProps<{
  workers: Worker[]
  selectedMembers: number[]
  startDate: string
  endDate: string
}>()

const emit = defineEmits<{
  'update:selectedMembers': [value: number[]]
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  reset: []
}>()

const activeTab = defineModel<string>('activeTab', { default: 'stats' })
</script>

<template>
  <header class="header">
    <div class="header-top">
      <span class="logo">企业 OA</span>
      <el-tabs v-model="activeTab" class="header-tabs">
        <el-tab-pane label="需求" name="requirements" />
        <el-tab-pane label="任务" name="tasks" />
        <el-tab-pane label="统计" name="stats" />
      </el-tabs>
    </div>

    <div v-if="activeTab === 'stats'" class="filters">
      <div class="filter-item">
        <span class="filter-label">成员</span>
        <el-select
          :model-value="selectedMembers"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="全部成员"
          clearable
          style="width: 200px"
          @update:model-value="emit('update:selectedMembers', $event ?? [])"
        >
          <el-option
            v-for="worker in workers"
            :key="worker.user_id"
            :label="worker.name"
            :value="worker.user_id"
          />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">开始时间</span>
        <el-date-picker
          :model-value="startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
          style="width: 150px"
          @update:model-value="emit('update:startDate', ($event as string) ?? props.startDate)"
        />
      </div>

      <div class="filter-item">
        <span class="filter-label">结束时间</span>
        <el-date-picker
          :model-value="endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 150px"
          @update:model-value="emit('update:endDate', ($event as string) ?? props.endDate)"
        />
      </div>

      <el-button class="reset-btn" @click="emit('reset')">重置</el-button>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 0 24px;
}

.logo {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.header-tabs {
  flex: 1;
}

.header-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.header-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.header-tabs :deep(.el-tabs__item.is-active) {
  color: #11aa66;
}

.header-tabs :deep(.el-tabs__active-bar) {
  background-color: #11aa66;
}

.filters {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 24px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.reset-btn {
  margin-left: auto;
  color: #11aa66;
  border-color: #11aa66;
}

.reset-btn:hover {
  color: #0d8f55;
  border-color: #0d8f55;
  background: #f0faf5;
}
</style>
