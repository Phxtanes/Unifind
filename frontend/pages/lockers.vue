<template>
  <div class="space-y-6">

    <div>
      <h2 class="text-lg font-bold text-slate-900">🗄️ ตู้เก็บของ (Lockers)</h2>
      <p class="text-xs text-slate-400 mt-0.5">ผังการจัดเก็บตู้ล็อกเกอร์ (Locker Room Map) อาคาร 24</p>
    </div>

    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div class="mb-6">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">ผังการจัดเก็บตู้ล็อกเกอร์ (Locker Room Map)</h3>
        <p class="text-xs text-slate-400 mt-1">แสดงสถานะความหนาแน่นและการจัดเก็บตู้ในคลังอาคาร 24</p>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-emerald-600">{{ lockersList.filter(l => l.status === 'empty').length }}</p>
          <p class="text-xs text-emerald-700 font-semibold mt-1">ตู้ว่าง</p>
        </div>
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-amber-600">{{ lockersList.filter(l => l.status === 'occupied').length }}</p>
          <p class="text-xs text-amber-700 font-semibold mt-1">ตู้ที่ใช้งาน</p>
        </div>
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-slate-700">12</p>
          <p class="text-xs text-slate-600 font-semibold mt-1">ตู้ทั้งหมด</p>
        </div>
      </div>
      
      <!-- Grid Layout -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="locker in lockersList" :key="locker.name" 
          :class="{
            'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50': locker.status === 'empty',
            'border-amber-200 bg-amber-50/50 hover:bg-amber-50': locker.status === 'occupied'
          }"
          class="border rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm transition-all duration-200">
          
          <div class="flex justify-between items-start">
            <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-white shadow-sm border border-slate-100">📦</span>
            <span :class="{
              'bg-emerald-100 text-emerald-800 border-emerald-200': locker.status === 'empty',
              'bg-amber-100 text-amber-800 border-amber-200': locker.status === 'occupied'
            }" class="px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider">
              {{ locker.status === 'empty' ? 'ตู้ว่าง' : 'เก็บของ' }}
            </span>
          </div>
          
          <div class="mt-4">
            <h4 class="text-xs font-bold text-slate-800 font-mono">{{ locker.name }} ({{ locker.monthName }})</h4>
            <p v-if="locker.status === 'occupied'" class="text-[10px] text-slate-650 font-medium truncate mt-1" :title="locker.item.name">
              สิ่งของ: <span class="font-bold text-slate-800">{{ locker.item.name }}</span>
            </p>
            <p v-if="locker.status === 'occupied'" class="text-[9px] text-slate-400 font-medium mt-0.5">
              เมื่อ: {{ formatDate(locker.item.date) }}
            </p>
            <p v-else class="text-[10px] text-slate-400 mt-1 font-medium italic">ตู้ว่างพร้อมจัดเก็บสิ่งของที่พบใหม่</p>
          </div>
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
const { formatDate } = useItemHelpers()

const lockersList = computed(() => {
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  const list = []
  for (let i = 1; i <= 12; i++) {
    const name = `ล็อกเกอร์ ที่ - ${i}`
    const occupiedBy = itemsStore.items.find(item =>
      item.locker &&
      (item.locker === name || item.locker.includes(`ที่ - ${i}`) || item.locker.includes(`ที่ -${i}`)) &&
      (item.status === 'stored' || item.status === 'found')
    )
    list.push({
      name,
      monthIndex: i,
      monthName: monthNames[i - 1],
      status: occupiedBy ? 'occupied' : 'empty',
      item: occupiedBy || null
    })
  }
  return list
})
</script>
