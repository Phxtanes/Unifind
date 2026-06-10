<template>
  <div class="space-y-6">

    <div>
      <h2 class="text-lg font-bold text-slate-900">📊 รายงานสถิติ (Reports)</h2>
      <p class="text-xs text-slate-400 mt-0.5">ภาพรวมและการวิเคราะห์ข้อมูลสิ่งของในระบบ</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Return Rate Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">อัตราการคืนของสำเร็จ</h4>
        <div class="py-4 text-center">
          <span class="text-5xl font-black text-indigo-600">{{ reportsData.rate }}%</span>
          <p class="text-[10px] text-slate-400 mt-2 font-medium">ของหายที่นำคืนเจ้าของเรียบร้อยแล้ว</p>
        </div>
        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div class="bg-indigo-600 h-2 transition-all duration-500" :style="{ width: `${reportsData.rate}%` }"></div>
        </div>
      </div>
      
      <!-- Category Stats -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">สถิติจำแนกตามหมวดหมู่</h4>
        <div class="space-y-2 mt-3 flex-1 overflow-y-auto max-h-48 pr-1">
          <div v-for="cat in reportsData.categories" :key="cat.name" class="space-y-1">
            <div class="flex justify-between text-[10px] font-bold text-slate-600">
              <span>{{ translateCategory(cat.name) }}</span>
              <span>{{ cat.count }} รายการ ({{ cat.percent }}%)</span>
            </div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div class="bg-indigo-500 h-1.5" :style="{ width: `${cat.percent}%` }"></div>
            </div>
          </div>
          <div v-if="reportsData.categories.length === 0" class="text-xs text-center text-slate-400 py-4">ยังไม่มีข้อมูลหมวดหมู่</div>
        </div>
      </div>
      
      <!-- Locker Capacity -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">วิเคราะห์ความจุคลัง</h4>
        <div class="py-4 text-center">
          <span class="text-3xl font-black text-slate-800">{{ occupiedLockers }} / 12</span>
          <p class="text-[10px] text-slate-400 mt-2 font-medium">ล็อกเกอร์ที่ถูกใช้งานในขณะนี้</p>
        </div>
        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div class="bg-emerald-500 h-2 transition-all duration-500" :style="{ width: `${Math.round((occupiedLockers / 12) * 100)}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Summary Table -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">สรุปภาพรวมระบบ</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-rose-50 rounded-xl border border-rose-100">
          <p class="text-2xl font-black text-rose-600">{{ reportsData.lost }}</p>
          <p class="text-xs text-rose-700 font-semibold mt-1">ของหาย</p>
        </div>
        <div class="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <p class="text-2xl font-black text-emerald-600">{{ reportsData.found }}</p>
          <p class="text-xs text-emerald-700 font-semibold mt-1">พบของ</p>
        </div>
        <div class="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p class="text-2xl font-black text-indigo-600">{{ reportsData.claimed }}</p>
          <p class="text-xs text-indigo-700 font-semibold mt-1">คืนแล้ว</p>
        </div>
        <div class="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p class="text-2xl font-black text-slate-700">{{ reportsData.total }}</p>
          <p class="text-xs text-slate-600 font-semibold mt-1">รายการทั้งหมด</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'

definePageMeta({ layout: 'dashboard' })

const itemsStore = useItemsStore()
const { translateCategory } = useItemHelpers()

const occupiedLockers = computed(() => {
  const lockerNames = new Set()
  itemsStore.items.forEach(item => {
    if (item.locker && (item.status === 'stored' || item.status === 'found')) {
      lockerNames.add(item.locker)
    }
  })
  return Math.min(lockerNames.size, 12)
})

const reportsData = computed(() => {
  const total = itemsStore.items.length
  const lost = itemsStore.countByStatus('lost')
  const found = itemsStore.countByStatus('found')
  const claimed = itemsStore.countByStatus('claimed')
  const rate = total > 0 ? Math.round((claimed / (lost + found + claimed || 1)) * 100) : 0

  const categoryCounts: Record<string, number> = {}
  itemsStore.items.forEach(item => {
    const cat = item.category || 'Other'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  const categories = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
    percent: total > 0 ? Math.round((count / total) * 100) : 0
  })).sort((a, b) => b.count - a.count)

  return { total, lost, found, claimed, rate, categories }
})
</script>
