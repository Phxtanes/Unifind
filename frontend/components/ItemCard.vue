<template>
  <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/60 flex flex-col justify-between hover:shadow-md transition duration-200">
    
    <div>
      <!-- Image Area -->
      <div class="relative h-44 w-full bg-slate-50 border-b border-slate-100">
        <img v-if="imageSrc" :src="imageSrc" class="w-full h-full object-cover" />
        <div v-else class="flex flex-col items-center justify-center h-full text-slate-350 text-xs font-medium bg-slate-50">
          <span class="text-lg mb-1">📷</span> ไม่มีภาพประกอบ
        </div>
        
        <!-- Status Tag -->
        <div class="absolute top-3 right-3">
          <span :class="{
            'bg-rose-50 text-rose-700 border-rose-100': item.status === 'lost',
            'bg-emerald-55 text-emerald-700 border-emerald-100': item.status === 'found' || item.status === 'stored',
            'bg-slate-100 text-slate-700 border-slate-200': item.status === 'claimed' || item.status === 'removed'
          }" class="px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider border">
            {{ item.status === 'lost' ? 'ตามหาเจ้าของ' : (item.status === 'found' || item.status === 'stored') ? 'พบเจอ' : 'คืนสำเร็จ' }}
          </span>
        </div>
      </div>

      <!-- Details -->
      <div class="p-5">
        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="text-sm font-bold text-slate-800 truncate" :title="item.name">{{ item.name }}</h3>
        </div>
        <p class="text-slate-400 text-[10px] font-medium mb-3">🕒 บันทึก: {{ formattedDate }}</p>
        <p class="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">{{ item.description || 'ไม่มีรายละเอียดเพิ่มเติม' }}</p>
        
        <!-- Details block -->
        <div class="bg-slate-50/50 p-3.5 rounded-lg space-y-2 text-xs border border-slate-100">
          <div class="flex items-center text-slate-600">
            <span class="text-slate-400 w-4 mr-1.5 text-center">📍</span> 
            <span class="truncate">สถานที่: <span class="font-semibold text-slate-700">{{ item.place }}</span></span>
          </div>
          <div class="flex items-center text-slate-600">
            <span class="text-slate-400 w-4 mr-1.5 text-center">📁</span> 
            <span class="truncate">หมวดหมู่: <span class="font-semibold text-slate-700">{{ item.category }}</span></span>
          </div>
          <div class="flex items-center text-slate-600" v-if="item.locker">
            <span class="text-slate-400 w-4 mr-1.5 text-center">📦</span> 
            <span class="truncate">ตู้ล็อกเกอร์: <span class="font-semibold text-slate-700">{{ item.locker }}</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="p-4 pt-0 border-t border-slate-50 mt-2 flex items-center gap-2">
      <!-- Status select dropdown -->
      <select :value="item.status === 'stored' ? 'found' : item.status === 'removed' ? 'claimed' : item.status" @change="$emit('changeStatus', item.id, $event.target.value)" 
        class="flex-1 bg-white border border-slate-200 text-xs font-semibold text-slate-600 py-2 px-2.5 rounded-lg outline-none focus:border-slate-800 transition">
        <option value="lost">🔴 ของหาย (Lost)</option>
        <option value="found">🟢 พบเจอ (Found)</option>
        <option value="claimed">⚫ คืนแล้ว (Claimed)</option>
      </select>

      <!-- Delete Button (Clean icon) -->
      <button @click="$emit('deleteItem', item.id)" 
        class="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-2 rounded-lg border border-slate-200 hover:border-rose-100 transition" title="ลบข้อมูล">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['changeStatus', 'deleteItem'])

const formattedDate = computed(() => {
  return dayjs(props.item.date).format('DD MMM YYYY HH:mm น.')
})

const imageSrc = computed(() => {
  const path = props.item.picture || props.item.image_url
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `http://localhost:9001${path}`
})
</script>

<style scoped>
/* Custom background helper for Found status to be professional */
.bg-emerald-55 {
  background-color: #f0fdf4;
}
</style>
