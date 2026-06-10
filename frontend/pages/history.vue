<template>
  <div class="space-y-6">

    <div>
      <h2 class="text-lg font-bold text-slate-900">📜 ประวัติการดำเนินการ (System Logs)</h2>
      <p class="text-xs text-slate-400 mt-0.5">แสดงประวัติความเคลื่อนไหวของการนำเข้า แก้ไข และลบสิ่งของในระบบ</p>
    </div>

    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">

      <!-- Audit Timeline -->
      <div class="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
        <div v-for="log in historyList" :key="log.id" class="relative">
          <!-- Dot Indicator -->
          <span :class="{
            'bg-rose-500 ring-rose-100': log.status === 'lost',
            'bg-emerald-500 ring-emerald-100': log.status === 'found' || log.status === 'stored',
            'bg-indigo-500 ring-indigo-100': log.status === 'claimed' || log.status === 'removed'
          }" class="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white flex items-center justify-center"></span>
          
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 class="text-xs font-bold text-slate-800">
                บันทึกข้อมูลสิ่งของ: <span class="text-indigo-600">{{ log.name }}</span>
              </h4>
              <p class="text-[10px] text-slate-450 mt-1 font-medium">
                สถานที่: <span class="font-semibold">{{ log.place }}</span> | หมวดหมู่: {{ translateCategory(log.category) }}
              </p>
              <p class="text-[9px] text-slate-400 mt-0.5">
                ลงบันทึกโดย: {{ log.staffName || 'System Admin' }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[9px] text-slate-400 font-mono block">{{ formatFullDate(log.date) }}</span>
              <span :class="{
                'bg-rose-50 text-rose-700': log.status === 'lost',
                'bg-emerald-50 text-emerald-700': log.status === 'found' || log.status === 'stored',
                'bg-indigo-50 text-indigo-700': log.status === 'claimed' || log.status === 'removed'
              }" class="px-2 py-0.5 text-[8px] font-bold rounded border uppercase mt-1 inline-block">
                {{ log.status === 'lost' ? 'สูญหาย' : (log.status === 'found' || log.status === 'stored') ? 'พร้อมส่งคืน' : 'ส่งคืนแล้ว' }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="historyList.length === 0" class="py-8 text-center text-slate-400 text-xs">ไม่มีรายการกิจกรรมในระบบ</div>
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
const { translateCategory, formatFullDate } = useItemHelpers()

const historyList = computed(() => {
  return [...itemsStore.items]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)
})
</script>
