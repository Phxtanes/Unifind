<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 sm:p-6" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col md:flex-row transform transition-all animate-fade-in-up">
      
      <!-- Left side: Image -->
      <div class="md:w-2/5 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex items-center justify-center relative min-h-[200px]">
        <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="absolute inset-0 w-full h-full object-cover" />
        <div v-else class="text-6xl text-slate-300">📷</div>
        <div class="absolute top-3 left-3 flex gap-2">
          <span class="px-2 py-1 text-[10px] font-bold rounded-lg shadow-sm bg-white/90 text-slate-800 border border-slate-200/50">
            {{ getMockCode(item) }}
          </span>
        </div>
      </div>

      <!-- Right side: Details -->
      <div class="md:w-3/5 p-6 flex flex-col">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 leading-tight mb-1">{{ item.name }}</h2>
            <div class="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span class="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{{ translateCategory(item.category) }}</span>
              <span :class="{
                'bg-rose-50 text-rose-700 border-rose-100': item.status === 'lost',
                'bg-emerald-50 text-emerald-700 border-emerald-100': item.status === 'found' || item.status === 'stored',
                'bg-slate-100 text-slate-700 border-slate-200': item.status === 'claimed' || item.status === 'removed'
              }" class="px-2 py-0.5 rounded border">
                {{ item.status === 'lost' ? 'ของหาย (Lost)' : (item.status === 'found' || item.status === 'stored') ? 'พบเจอ (Found)' : 'คืนแล้ว (Claimed)' }}
              </span>
            </div>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-rose-500 transition outline-none p-1 -mr-2 -mt-2">
            <span class="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <div class="space-y-4 flex-1">
          <!-- Detail Row -->
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">สถานที่</p>
            <p class="text-sm text-slate-700 flex items-center gap-2"><span class="text-rose-500">📍</span> {{ item.place || '-' }}</p>
          </div>
          
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">วันที่และเวลา</p>
            <p class="text-sm text-slate-700 flex items-center gap-2"><span class="text-indigo-500">🕒</span> {{ formatFullDate(item.date) }}</p>
          </div>

          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ตู้ล็อกเกอร์</p>
            <p class="text-sm text-slate-700 flex items-center gap-2"><span class="text-amber-500">🗄️</span> {{ item.locker || '-' }}</p>
          </div>

          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">รายละเอียดเพิ่มเติม</p>
            <div class="bg-slate-50 border border-slate-100 rounded-xl p-3 min-h-[60px]">
              <p class="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{{ item.description || 'ไม่มีรายละเอียดเพิ่มเติม' }}</p>
            </div>
          </div>

          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">เจ้าหน้าที่ผู้บันทึก</p>
            <p class="text-xs text-slate-500 flex items-center gap-2"><span>👤</span> {{ item.staffName || 'Admin' }}</p>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button @click="$emit('close')" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useItemHelpers } from '~/composables/useItemHelpers'

const props = defineProps<{
  show: boolean
  item: any
}>()

const emit = defineEmits(['close'])

const { getItemImageSrc, translateCategory, getMockCode, formatFullDate } = useItemHelpers()
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
