<script setup lang="ts">
import type { Worker } from '../api/types/worker'

const props = defineProps<{
  workers: Worker[]
  selectedMember: number | ''
  dateRange: [string, string]
}>()

const emit = defineEmits<{
  'update:selectedMember': [value: number | '']
  'update:dateRange': [value: [string, string]]
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
          :model-value="selectedMember"
          placeholder="全部成员"
          clearable
          style="width: 160px"
          @update:model-value="emit('update:selectedMember', $event ?? '')"
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
          :model-value="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 280px"
          @update:model-value="
            emit('update:dateRange', ($event as [string, string] | null) ?? props.dateRange)
          "
        />
      </div>
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

.filters {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  background: #fafafa;
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
</style>
