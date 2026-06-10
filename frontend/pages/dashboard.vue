<template>
  <div class="space-y-8">

    <!-- Horizontal Statistics Cards -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Lost Items Stat Card -->
      <NuxtLink to="/lost" class="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition group">
        <div class="space-y-1">
          <p class="text-rose-500 text-[10px] font-bold uppercase tracking-wider">ของหาย (LOST)</p>
          <p class="text-2xl font-black text-rose-600 group-hover:scale-105 transition-transform duration-150 inline-block">{{ itemsStore.countByStatus('lost') }}</p>
          <p class="text-[10px] text-slate-400 font-medium">รอการติดต่อกลับ</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-center text-xl text-rose-600">👜</div>
      </NuxtLink>
      
      <!-- Found Items Stat Card -->
      <NuxtLink to="/found" class="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition group">
        <div class="space-y-1">
          <p class="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">พบของ (FOUND)</p>
          <p class="text-2xl font-black text-emerald-600 group-hover:scale-105 transition-transform duration-150 inline-block">{{ itemsStore.countByStatus('found') }}</p>
          <p class="text-[10px] text-slate-400 font-medium">รายการที่เก็บรักษา</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-xl text-emerald-600">🧩</div>
      </NuxtLink>
      
      <!-- Claimed Items Stat Card -->
      <NuxtLink to="/claimed" class="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition group">
        <div class="space-y-1">
          <p class="text-indigo-500 text-[10px] font-bold uppercase tracking-wider">คืนแล้ว (CLAIMED)</p>
          <p class="text-2xl font-black text-indigo-600 group-hover:scale-105 transition-transform duration-150 inline-block">{{ itemsStore.countByStatus('claimed') }}</p>
          <p class="text-[10px] text-slate-400 font-medium">ส่งคืนเจ้าของแล้ว</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-xl text-indigo-600">🔄</div>
      </NuxtLink>
      
      <!-- Expired Items Stat Card -->
      <div class="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between hover:shadow-md transition group">
        <div class="space-y-1">
          <p class="text-amber-500 text-[10px] font-bold uppercase tracking-wider">เกินกำหนด (EXPIRED)</p>
          <p class="text-2xl font-black text-amber-600 group-hover:scale-105 transition-transform duration-150 inline-block">{{ itemsStore.countExpired }}</p>
          <p class="text-[10px] text-slate-400 font-medium">เกิน 30 วันยังไม่มารับ</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center text-xl text-amber-600">🗄️</div>
      </div>
    </section>

    <!-- Middle Layout Section: Status Overview & Trend Chart -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Status Donut Chart Overview -->
      <div class="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div class="mb-4">
          <h3 class="text-sm font-bold text-[#0B132B] uppercase tracking-wider">ภาพรวมสถานะสิ่งของ</h3>
          <p class="text-xs text-slate-400 mt-0.5">อัตราส่วนการกระจายสถานะทั้งหมดในระบบ</p>
        </div>
        
        <div class="flex flex-col sm:flex-row items-center gap-8 md:gap-12 flex-1 py-2">
          <!-- Chart Left -->
          <div class="relative flex items-center justify-center shrink-0">
            <svg class="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" stroke="#F1F5F9" stroke-width="8" fill="transparent" />
              <circle v-for="(segment, index) in chartSegments" :key="index"
                cx="50" cy="50" r="38" :stroke="segment.color" stroke-width="8"
                fill="transparent" 
                :stroke-dasharray="segment.dashArray" 
                :stroke-dashoffset="segment.dashOffset"
                class="transition-all duration-1000 ease-in-out" />
            </svg>
            <div class="absolute flex flex-col items-center justify-center">
              <span class="text-3xl font-black text-slate-800">{{ itemsStore.items.length }}</span>
              <span class="text-[10px] text-slate-400 font-bold mt-1">รายการทั้งหมด</span>
            </div>
          </div>
          
          <!-- Legends Right -->
          <div class="flex-1 space-y-3 w-full">
            <div v-for="seg in chartSegments" :key="seg.label" class="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: seg.color }"></span>
                <span class="font-medium text-slate-600">{{ seg.label }}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-slate-800">{{ seg.count }}</span>
                <span class="text-[10px] text-slate-400 ml-1.5">({{ seg.percent }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Weekly Trend Chart -->
      <div class="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div class="mb-4">
          <h3 class="text-sm font-bold text-[#0B132B] uppercase tracking-wider">แนวโน้มการทำของหาย &amp; พบของ</h3>
          <p class="text-xs text-slate-400 mt-0.5">เปรียบเทียบสถิติสัปดาห์นี้และสัปดาห์ที่ผ่านมา</p>
        </div>
        
        <div class="h-36 w-full pt-2">
          <svg class="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
            <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4" />
            <line x1="0" y1="60" x2="300" y2="60" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4" />
            <line x1="0" y1="100" x2="300" y2="100" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4" />
            <path d="M 10 90 Q 75 40, 150 75 T 290 30" fill="none" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
            <path d="M 10 100 Q 75 70, 150 45 T 290 20" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" />
            <path d="M 10 90 Q 75 40, 150 75 T 290 30 L 290 110 L 10 110 Z" fill="url(#lostGrad)" opacity="0.06" />
            <path d="M 10 100 Q 75 70, 150 45 T 290 20 L 290 110 L 10 110 Z" fill="url(#foundGrad)" opacity="0.06" />
            <defs>
              <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#EF4444" />
                <stop offset="100%" stop-color="#EF4444" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="foundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10B981" />
                <stop offset="100%" stop-color="#10B981" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div class="flex justify-between items-center text-[10px] text-slate-400 mt-4 border-t border-slate-50 pt-3">
          <div class="flex gap-4">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span> ของหาย (Lost)</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> พบของ (Found)</span>
          </div>
          <span>อัปเดตล่าสุด: {{ lastUpdatedText }}</span>
        </div>
      </div>
    </section>

    <!-- Bottom Layout Section: Recent Activity & Locker Summary -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Recent Stored Items -->
      <div class="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">รายการนำส่งล่าสุด</h3>
            <p class="text-xs text-slate-400">ของที่พบและถูกจัดเก็บเข้าคลังในช่วงนี้</p>
          </div>
          <NuxtLink to="/items" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">ดูทั้งหมด →</NuxtLink>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th class="pb-3">รายการ</th>
                <th class="pb-3">สถานที่</th>
                <th class="pb-3">ตู้ล็อกเกอร์</th>
                <th class="pb-3">วันที่</th>
                <th class="pb-3 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 text-xs">
              <tr v-for="item in itemsStore.items.slice(0, 4)" :key="item.id" class="hover:bg-slate-50/30">
                <td class="py-3 font-semibold text-slate-800 flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-200">
                    <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-full h-full object-cover" />
                    <span v-else class="text-lg">{{ item.status === 'lost' ? '👜' : '🧩' }}</span>
                  </div>
                  <span class="truncate max-w-[150px]" :title="item.name">{{ item.name }}</span>
                </td>
                <td class="py-3 text-slate-500 truncate max-w-[120px]" :title="item.place">{{ item.place }}</td>
                <td class="py-3 font-mono text-slate-600">{{ item.locker || '-' }}</td>
                <td class="py-3 text-slate-450">{{ formatDate(item.date) }}</td>
                <td class="py-3 text-right">
                  <span :class="{
                    'bg-rose-50 text-rose-700 border-rose-100': item.status === 'lost',
                    'bg-emerald-50 text-emerald-700 border-emerald-100': item.status === 'found' || item.status === 'stored',
                    'bg-slate-100 text-slate-700 border-slate-200': item.status === 'claimed' || item.status === 'removed'
                  }" class="px-2 py-0.5 text-[9px] font-bold rounded border uppercase">
                    {{ item.status === 'lost' ? 'ของหาย' : (item.status === 'found' || item.status === 'stored') ? 'พร้อมคืน' : 'คืนแล้ว' }}
                  </span>
                </td>
              </tr>
              <tr v-if="itemsStore.items.length === 0">
                <td colspan="5" class="py-12 text-center text-slate-400">ไม่มีรายการประวัติสิ่งของล่าสุด</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lockers Overview Preview Card -->
      <div class="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">ตู้เก็บของ (Lockers)</h3>
          <p class="text-xs text-slate-400 mb-4">จำลองการจัดเก็บสิ่งของในตู้ล็อกเกอร์</p>
          
          <div class="grid grid-cols-4 gap-2 mb-4">
            <NuxtLink v-for="locker in lockersList" :key="locker.name" 
              to="/lockers"
              :class="{
                'bg-emerald-50 border-emerald-200 text-emerald-700': locker.status === 'empty',
                'bg-amber-50 border-amber-200 text-amber-700': locker.status === 'occupied',
              }"
              class="h-12 border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition duration-150 text-center p-1">
              <span class="text-[9px] font-bold">ตู้ที่ {{ locker.monthIndex }}</span>
              <span class="text-[8px] opacity-75 font-semibold leading-none mt-0.5">{{ locker.monthName }}</span>
              <span class="text-[8px] opacity-65 mt-0.5">{{ locker.status === 'empty' ? 'ว่าง' : 'มีของ' }}</span>
            </NuxtLink>
          </div>
        </div>

        <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[11px] space-y-2">
          <div class="flex justify-between items-center text-slate-600">
            <span>🟢 ตู้ที่ว่าง:</span>
            <span class="font-bold text-slate-800">{{ lockersList.filter(l => l.status === 'empty').length }} ตู้</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span>🟠 ตู้ที่ใช้งาน:</span>
            <span class="font-bold text-slate-800">{{ lockersList.filter(l => l.status === 'occupied').length }} ตู้</span>
          </div>
          <NuxtLink to="/lockers" class="w-full text-center text-[10px] font-bold text-indigo-600 hover:text-indigo-700 pt-1 block">ตรวจสอบผังตู้ล็อกเกอร์ทั้งหมด →</NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'
import dayjs from 'dayjs'

definePageMeta({ layout: 'dashboard' })

const itemsStore = useItemsStore()
const { formatDate, getItemImageSrc } = useItemHelpers()

const lastUpdated = ref(new Date())
const lastUpdatedText = ref('เมื่อสักครู่')

const updateLastUpdatedText = () => {
  const diffMs = new Date().getTime() - lastUpdated.value.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) {
    lastUpdatedText.value = 'เมื่อสักครู่'
  } else {
    lastUpdatedText.value = `${diffMins} นาทีที่แล้ว`
  }
}

onMounted(async () => {
  if (itemsStore.items.length === 0) {
    await itemsStore.fetchItems()
  }
  lastUpdated.value = itemsStore.lastUpdated || new Date()
  updateLastUpdatedText()
})

const chartSegments = computed(() => {
  const total = itemsStore.items.length || 1
  const lost = itemsStore.countByStatus('lost')
  const found = itemsStore.countByStatus('found')
  const claimed = itemsStore.countByStatus('claimed')
  const expired = itemsStore.countExpired
  
  const categories = [
    { label: 'ของหาย (Lost)', count: lost, color: '#EF4444' },
    { label: 'พบของ (Found)', count: found, color: '#10B981' },
    { label: 'คืนแล้ว (Claimed)', count: claimed, color: '#4F46E5' },
    { label: 'เกินกำหนด (Expired)', count: expired, color: '#F59E0B' }
  ]
  
  let accumulatedPercent = 0
  const circumference = 238.76

  return categories.map(cat => {
    const percent = Math.round((cat.count / total) * 100)
    const strokeDash = circumference
    const strokeOffset = circumference - (cat.count / total) * circumference
    const offset = (accumulatedPercent / 100) * circumference
    accumulatedPercent += (cat.count / total) * 100

    return {
      ...cat,
      percent,
      dashArray: `${strokeDash}`,
      dashOffset: `${strokeOffset - offset}`
    }
  })
})

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
