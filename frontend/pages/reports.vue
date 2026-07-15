<template>
  <div class="space-y-6 print-container pb-12">
    <!-- Header Section (Hidden during Print) -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
      <div>
        <h1 class="text-xl font-bold text-slate-900">{{ $t('รายงานและสถิติภาพรวม') }}</h1>
        <p class="text-xs text-slate-500 font-medium">{{ $t('วิเคราะห์ข้อมูลความสำเร็จ สถิติจำนวนของหาย และประสิทธิภาพคลังสินค้า') }}</p>
      </div>
      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button 
          @click="exportToCSV"
          class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition duration-200 border border-slate-200"
        >
          <font-awesome :icon="['fas', 'file-csv']" class="text-slate-500" />
          {{ langStore.locale === 'th' ? 'ส่งออกเป็น CSV' : 'Export to CSV' }}
        </button>
       <!--  <button 
          @click="printReport"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-200 shadow-sm"
        >
          <font-awesome :icon="['fas', 'print']" />
          Print / Save PDF
        </button> -->
      </div>
    </div>

    <!-- Print-Only Header -->
    <div class="hidden print-header border-b-2 border-slate-900 pb-4 mb-6">
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-2xl font-black text-slate-900 uppercase">UniFind - {{ langStore.locale === 'th' ? 'รายงานและวิเคราะห์ข้อมูล' : 'Reports & Analytics' }}</h1>
          <p class="text-xs text-slate-500 font-bold mt-1">{{ $t('รายงานสรุปข้อมูลสิ่งของสูญหายและประสิทธิภาพระบบ') }}</p>
        </div>
        <div class="text-right text-xs text-slate-600">
          <p>{{ $t('พิมพ์เมื่อ:') }} {{ formatFullDate(new Date().toISOString()) }}</p>
          <p>{{ $t('ช่วงเวลาที่เลือก:') }} {{ periodLabel }}</p>
        </div>
      </div>
    </div>

    <!-- Period Selector Controls (Hidden during Print) -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 no-print">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex bg-slate-100 p-1 rounded-xl">
          <button 
            v-for="tab in periodTabs" 
            :key="tab.value"
            @click="selectedPeriod = tab.value"
            :class="[
              selectedPeriod === tab.value 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            ]"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition duration-150"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Custom Date Pickers -->
        <div v-if="selectedPeriod === 'custom'" class="flex items-center gap-2 animate-fade-in-up">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-400 uppercase">{{ $t('เริ่มต้น') }}</span>
            <input 
              type="date" 
              v-model="startDate" 
              class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" 
            />
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold text-slate-400 uppercase">{{ $t('สิ้นสุด') }}</span>
            <input 
              type="date" 
              v-model="endDate" 
              class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Active Filter Notification (Only visible when no items found in period) -->
    <div v-if="filteredItems.length === 0 && !itemsStore.loading" class="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800">
      <p class="text-sm font-semibold">{{ $t('ไม่พบข้อมูลรายงานในช่วงเวลาที่ท่านเลือก ({periodLabel})', { periodLabel }) }}</p>
      <p class="text-xs text-amber-600 mt-1">{{ $t('กรุณาเลือกช่วงเวลาอื่น หรือตรวจสอบการเชื่อมต่อข้อมูล') }}</p>
    </div>

    <!-- Analytics Dashboard Grid -->
    <div v-else class="space-y-6">
      <!-- Top Overview Metrics Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span class="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{{ $t('ของหายแจ้งใหม่') }}</span>
          <div class="my-2">
            <span class="text-3xl font-black text-slate-800">{{ summaryData.lost }}</span>
            <span class="text-[10px] font-medium text-slate-400 ml-1">{{ $t('รายการ') }}</span>
          </div>
          <p class="text-[9px] text-slate-400 leading-none">{{ langStore.locale === 'th' ? 'ผู้ใช้ลงบันทึกในระบบ' : 'Recorded by users' }}</p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{{ $t('สิ่งของที่พบเจอ') }}</span>
          <div class="my-2">
            <span class="text-3xl font-black text-slate-800">{{ summaryData.found }}</span>
            <span class="text-[10px] font-medium text-slate-400 ml-1">{{ $t('รายการ') }}</span>
          </div>
          <p class="text-[9px] text-slate-400 leading-none">{{ $t('นำส่งเข้าจัดเก็บระบบ') }}</p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{{ $t('ส่งมอบคืนสำเร็จ') }}</span>
          <div class="my-2">
            <span class="text-3xl font-black text-slate-800">{{ summaryData.claimed }}</span>
            <span class="text-[10px] font-medium text-slate-400 ml-1">{{ $t('รายการ') }}</span>
          </div>
          <p class="text-[9px] text-slate-400 leading-none">{{ $t('คืนเจ้าของเรียบร้อยแล้ว') }}</p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{{ $t('รายการทั้งหมด') }}</span>
          <div class="my-2">
            <span class="text-3xl font-black text-slate-800">{{ summaryData.total }}</span>
            <span class="text-[10px] font-medium text-slate-400 ml-1">{{ $t('รายการ') }}</span>
          </div>
          <p class="text-[9px] text-slate-400 leading-none">{{ $t('ผลรวมธุรกรรมทั้งสิ้น') }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Return Success Rate -->
        <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div class="pt-6">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('อัตราความสำเร็จในการส่งคืน') }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">{{ $t('ของหายที่ถูกนำส่งคืนเจ้าของสำเร็จ') }}</p>
          </div>
          <div class="py-6 flex items-center justify-center">
            <!-- Semi-radial progress display or pure big text -->
            <div class="relative flex items-center justify-center w-32 h-32">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#F1F5F9" stroke-width="8" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#4F46E5" stroke-width="8" fill="transparent" 
                        :stroke-dasharray="251.2" 
                        :stroke-dashoffset="251.2 - (251.2 * performanceData.returnRate) / 100" 
                        stroke-linecap="round"
                        class="transition-all duration-700 ease-out-quad" />
              </svg>
              <div class="absolute text-center">
                <span class="text-3xl font-black text-slate-800">{{ performanceData.returnRate }}%</span>
              </div>
            </div>
          </div>
          <div class="text-center text-[10px] font-bold text-indigo-600 bg-indigo-50/50 py-1.5 rounded-lg border border-indigo-100/40">
            {{ $t('สำเร็จ {claimed} จากของที่พบเจอ {found} ชิ้น', { claimed: summaryData.claimed, found: summaryData.found }) }}
          </div>
        </div>

        <!-- Average Retention Time -->
        <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div class="pt-6">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('ระยะเวลาเฉลี่ยในการเก็บรักษา') }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">{{ $t('เวลาเฉลี่ยในการฝากเก็บสิ่งของก่อนเจ้าของมารับคืน') }}</p>
          </div>
          <div class="py-6 text-center">
            <div class="flex justify-center items-baseline gap-1">
              <span class="text-5xl font-black text-amber-500">{{ performanceData.avgDuration }}</span>
              <span class="text-xs font-bold text-slate-500">{{ $t('วัน') }}</span>
            </div>
            <p class="text-[10px] text-slate-400 mt-3 font-semibold">{{ $t('อ้างอิงจากข้อมูลส่งคืนสำเร็จในระบบ') }}</p>
          </div>
          <div class="text-[10px] text-center text-slate-500 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
            {{ $t('ระบบจัดเก็บรวดเร็วและปลอดภัย') }}
          </div>
        </div>

        <!-- Storage Rate -->
        <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div class="pt-6">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ $t('อัตราการบันทึกจัดเก็บสิ่งของ (Storage Rate)') }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">{{ $t('ของที่พบเจอและนำเข้าจัดเก็บในล็อกเกอร์') }}</p>
          </div>
          <div class="py-6 flex flex-col items-center justify-center">
            <span class="text-5xl font-black text-emerald-600">{{ performanceData.storageRate }}%</span>
            <p class="text-xs font-bold text-slate-700 mt-3">{{ $t('ใช้งานล็อกเกอร์: {occupied} / 12 ตู้', { occupied: occupiedLockers }) }}</p>
          </div>
          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="bg-emerald-500 h-2 transition-all duration-500" :style="{ width: `${performanceData.storageRate}%` }"></div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown & Location Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Category Stats -->
        <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div class="pt-6 mb-4">
            <h4 class="text-xs font-bold text-slate-505 uppercase tracking-wider">{{ $t('จำแนกตามหมวดหมู่สิ่งของ') }}</h4>
          </div>
          <div class="space-y-4">
            <div v-for="cat in categoryStats" :key="cat.name" class="space-y-1">
              <div class="flex justify-between text-xs font-bold text-slate-700">
                <span>{{ translateCategory(cat.name) }}</span>
                <span>{{ cat.count }} {{ langStore.locale === 'th' ? 'รายการ' : 'items' }} ({{ cat.percent }}%)</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-500 h-2 rounded-full" :style="{ width: `${cat.percent}%` }"></div>
              </div>
            </div>
            <div v-if="categoryStats.length === 0" class="text-xs text-center text-slate-400 py-8">{{ langStore.locale === 'th' ? 'ไม่มีข้อมูลหมวดหมู่' : 'No category data' }}</div>
          </div>
        </div>

        <!-- Location Hotspots -->
        <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div class="pt-6 mb-4">
            <h4 class="text-xs font-bold text-slate-505 uppercase tracking-wider">{{ $t('จำแนกตามสถานที่พบเจอ') }}</h4>
          </div>
          <div class="space-y-4">
            <div v-for="loc in locationStats" :key="loc.name" class="space-y-1">
              <div class="flex justify-between text-xs font-bold text-slate-700">
                <span>{{ loc.name }}</span>
                <span>{{ loc.count }} {{ langStore.locale === 'th' ? 'รายการ' : 'items' }} ({{ loc.percent }}%)</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-slate-700 h-2 rounded-full" :style="{ width: `${loc.percent}%` }"></div>
              </div>
            </div>
            <div v-if="locationStats.length === 0" class="text-xs text-center text-slate-400 py-8">{{ langStore.locale === 'th' ? 'ไม่มีข้อมูลสถานที่' : 'No location data' }}</div>
          </div>
        </div>
      </div>

      <!-- Unclaimed Items Over 30 Days (ของค้างคลังเกิน 30 วัน) -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden page-break-before">
        <div class="pt-4 px-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">{{ $t('รายงานของค้างส่งคืน (Unclaimed Items)') }}</h3>
            <p class="text-xs text-slate-400 mt-1">{{ $t('สิ่งของที่พบแต่ไม่มีผู้มารับคืนและตกค้างในคลังมากกว่า 30 วัน') }}</p>
          </div>
          <span class="self-start px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-full">
            {{ langStore.locale === 'th' ? `ตกค้างเกิน 30 วัน: ${unclaimedOver30Days.length} รายการ` : `Over 30 Days: ${unclaimedOver30Days.length} items` }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/70 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th class="py-4 px-6">{{ $t('ชื่อสิ่งของ') }}</th>
                <th class="py-4 px-6">{{ $t('หมวดหมู่') }}</th>
                <th class="py-4 px-6">{{ $t('ตู้จัดเก็บ') }}</th>
                <th class="py-4 px-6">{{ $t('สถานที่') }}</th>
                <th class="py-4 px-6">{{ $t('วันที่') }}</th>
                <th class="py-4 px-6 text-right">{{ $t('ระยะเวลาค้างคลัง') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
              <tr v-for="item in unclaimedOver30Days" :key="item.id" class="hover:bg-indigo-50/30 transition-all duration-150">
                <td class="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {{ item.name }}
                </td>
                <td class="py-4 px-6">
                  <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100">
                    {{ translateCategory(item.category) }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">
                    <font-awesome :icon="['fas', 'box-archive']" />
                    {{ item.locker && item.locker !== '-' ? item.locker : $t('ไม่มีตู้') }}
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-500 font-medium">
                  <span class="flex items-center gap-1">
                    <font-awesome :icon="['fas', 'location-dot']" class="text-slate-400 w-3 text-center" />
                    {{ item.place }}
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-500 font-medium">
                  <span class="flex items-center gap-1">
                    <font-awesome :icon="['fas', 'calendar-days']" class="text-slate-400 w-3 text-center" />
                    {{ formatFullDate(item.date) }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full font-bold text-[10px] border border-rose-100 shadow-sm">
                    <font-awesome :icon="['fas', 'circle-exclamation']" class="text-rose-500 animate-pulse" />
                    {{ item.ageInDays }} {{ $t('วัน') }}
                  </span>
                </td>
              </tr>
              <tr v-if="unclaimedOver30Days.length === 0">
                <td colspan="6" class="py-8 text-center text-slate-400 font-medium">{{ langStore.locale === 'th' ? 'ไม่มีสิ่งของค้างส่งคืนเกินกว่า 30 วัน' : 'No unclaimed items exceeding 30 days' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'
import { useLangStore } from '~/stores/lang'

definePageMeta({ layout: 'dashboard', title: 'รายงานและสถิติระบบ', icon: 'chart-pie' })

const itemsStore = useItemsStore()
const langStore = useLangStore()
const { translateCategory, formatFullDate, formatDescription } = useItemHelpers()

// Fetch data on component mount
onMounted(async () => {
  await itemsStore.fetchItems()
})

// Active periods state
const selectedPeriod = ref('monthly') // Default to monthly
const startDate = ref('')
const endDate = ref('')

const periodTabs = computed(() => [
  { label: langStore.locale === 'th' ? 'ประจำวัน (Daily)' : 'Daily', value: 'daily' },  
  { label: langStore.locale === 'th' ? 'ประจำสัปดาห์ (Weekly)' : 'Weekly', value: 'weekly' },
  { label: langStore.locale === 'th' ? 'ประจำเดือน (Monthly)' : 'Monthly', value: 'monthly' },
  { label: langStore.locale === 'th' ? 'กำหนดเอง (Custom)' : 'Custom', value: 'custom' }
])

// Label descriptor for the chosen period
const periodLabel = computed(() => {
  if (selectedPeriod.value === 'daily') return langStore.locale === 'th' ? 'ประจำวัน (วันนี้)' : 'Daily (Today)'
  if (selectedPeriod.value === 'weekly') return langStore.locale === 'th' ? 'ประจำสัปดาห์ (7 วันล่าสุด)' : 'Weekly (Last 7 Days)'
  if (selectedPeriod.value === 'monthly') return langStore.locale === 'th' ? 'ประจำเดือน (30 วันล่าสุด)' : 'Monthly (Last 30 Days)'
  if (selectedPeriod.value === 'custom') {
    if (startDate.value && endDate.value) {
      return langStore.locale === 'th' ? `ช่วงวันที่ ${startDate.value} ถึง ${endDate.value}` : `Date Range: ${startDate.value} to ${endDate.value}`
    }
    if (startDate.value) return langStore.locale === 'th' ? `ตั้งแต่วันที่ ${startDate.value}` : `From Date: ${startDate.value}`
    if (endDate.value) return langStore.locale === 'th' ? `จนถึงวันที่ ${endDate.value}` : `Until Date: ${endDate.value}`
    return langStore.locale === 'th' ? 'กำหนดช่วงเวลาเอง' : 'Select Date Range'
  }
  return ''
})

// Filter items strictly based on selected period
const filteredItems = computed(() => {
  const allItems = itemsStore.items
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  return allItems.filter(item => {
    if (!item.date) return false
    const itemTime = new Date(item.date).getTime()

    if (selectedPeriod.value === 'daily') {
      return itemTime >= todayStart
    } else if (selectedPeriod.value === 'weekly') {
      const oneWeekAgo = todayStart - 7 * 24 * 60 * 60 * 1000
      return itemTime >= oneWeekAgo
    } else if (selectedPeriod.value === 'monthly') {
      const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000
      return itemTime >= thirtyDaysAgo
    } else if (selectedPeriod.value === 'custom') {
      let match = true
      if (startDate.value) {
        const start = new Date(startDate.value + 'T00:00:00').getTime()
        match = match && itemTime >= start
      }
      if (endDate.value) {
        const end = new Date(endDate.value + 'T23:59:59').getTime()
        match = match && itemTime <= end
      }
      return match
    }
    return true
  })
})

const filteredFoundItems = computed(() => {
  return filteredItems.value.filter(item => item.type === 'found')
})

const filteredLostItems = computed(() => {
  return filteredItems.value.filter(item => item.type === 'lost')
})

// Locker utilization
const occupiedLockers = computed(() => {
  const lockerNames = new Set()
  itemsStore.items.forEach(item => {
    if (item.locker && item.locker !== '-' && item.type === 'found' && (item.status === 'stored' || item.status === 'found')) {
      lockerNames.add(item.locker)
    }
  })
  return Math.min(lockerNames.size, 12)
})

// Summary metrics object
const summaryData = computed(() => {
  const total = filteredItems.value.length
  const lost = filteredLostItems.value.length
  const found = filteredFoundItems.value.length
  
  // Claimed refers to found items that are returned
  const claimed = filteredFoundItems.value.filter(
    item => item.status === 'claimed' || item.status === 'returned'
  ).length

  return { total, lost, found, claimed }
})

// Performance Analytics calculations
const performanceData = computed(() => {
  const foundTotal = filteredFoundItems.value.length

  // 1. Return Success Rate
  const claimedCount = filteredFoundItems.value.filter(
    item => item.status === 'claimed' || item.status === 'returned'
  ).length
  const returnRate = foundTotal > 0 ? Math.round((claimedCount / foundTotal) * 100) : 0

  // 2. Locker Storage Success Rate
  const storedInLocker = filteredFoundItems.value.filter(
    item => item.locker && item.locker !== '-'
  ).length
  const storageRate = foundTotal > 0 ? Math.round((storedInLocker / foundTotal) * 100) : 0

  // 3. Average Retention Time (Duration from found date to claim date)
  let totalDurationDays = 0
  let claimedWithDurationCount = 0

  filteredFoundItems.value.forEach(item => {
    if (item.status === 'claimed' || item.status === 'returned') {
      const foundDate = new Date(item.date).getTime()
      // If updated_at exists, use it as claim date, otherwise fall back to now
      const claimDate = item.updated_at ? new Date(item.updated_at).getTime() : new Date().getTime()
      const diffMs = claimDate - foundDate
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      
      totalDurationDays += Math.max(0.1, diffDays) // ensure at least 0.1 to avoid zero
      claimedWithDurationCount++
    }
  })

  const avgDuration = claimedWithDurationCount > 0 
    ? parseFloat((totalDurationDays / claimedWithDurationCount).toFixed(1)) 
    : 0

  return {
    returnRate,
    storageRate,
    avgDuration
  }
})

// Category distribution
const categoryStats = computed(() => {
  const total = filteredFoundItems.value.length
  if (total === 0) return []

  const counts: Record<string, number> = {}
  filteredFoundItems.value.forEach(item => {
    const cat = item.category || 'Other'
    counts[cat] = (counts[cat] || 0) + 1
  })

  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percent: Math.round((count / total) * 100)
  })).sort((a, b) => b.count - a.count)
})

// Location hotspot distribution
const locationStats = computed(() => {
  const total = filteredFoundItems.value.length
  if (total === 0) return []

  const counts: Record<string, number> = {}
  filteredFoundItems.value.forEach(item => {
    const loc = item.place || 'ไม่ระบุ'
    counts[loc] = (counts[loc] || 0) + 1
  })

  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percent: Math.round((count / total) * 100)
  })).sort((a, b) => b.count - a.count).slice(0, 5) // Limit to top 5
})

// Unclaimed Items exceeding 30 days
const unclaimedOver30Days = computed(() => {
  const now = new Date()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  return itemsStore.items.filter(item => {
    if (item.type !== 'found') return false
    // Unclaimed are active item statuses of 'stored' or 'found' or 'matched'
    const isActive = item.status === 'found' || item.status === 'stored' || item.status === 'matched'
    if (!isActive) return false

    const itemDate = new Date(item.date).getTime()
    return (now.getTime() - itemDate) > thirtyDaysMs
  }).map(item => {
    const itemDate = new Date(item.date).getTime()
    const ageInDays = Math.floor((now.getTime() - itemDate) / (1000 * 60 * 60 * 24))
    return {
      ...item,
      ageInDays
    }
  }).sort((a, b) => b.ageInDays - a.ageInDays)
})

// CSV Data Export Function
const exportToCSV = () => {
  const headers = ['ID', 'ประเภทสิ่งของ', 'ชื่อสิ่งของ', 'หมวดหมู่', 'สถานที่บันทึก', 'วันที่บันทึก', 'สถานะในระบบ', 'ตู้เก็บของ', 'รายละเอียดตำหนิ']
  
  const rows = filteredItems.value.map(item => [
    item.id,
    item.type === 'found' ? 'ของที่พบเจอ (Found)' : 'ของหายที่แจ้งไว้ (Lost)',
    item.name,
    translateCategory(item.category),
    item.place,
    formatFullDate(item.date),
    item.status === 'lost' ? 'ของหาย' : (item.status === 'found' || item.status === 'stored') ? 'จัดเก็บในคลัง' : 'ส่งคืนแล้ว',
    item.locker || '-',
    formatDescription(item.description)
  ])

  // Include Excel UTF-8 BOM
  const BOM = '\uFEFF'
  const csvString = BOM + [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\r\n')

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `unifind_report_${selectedPeriod.value}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Print / Save to PDF Trigger
/* const printReport = () => {
  window.print()
} */
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Custom CSS curves for visual transitions */
.ease-out-quad {
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Print CSS Layout Adjustments */
@media print {
  /* Hide all interactive components, navigation layout, sidebar, etc. */
  .no-print, 
  aside, 
  nav, 
  header, 
  button, 
  .fixed, 
  .sticky {
    display: none !important;
  }
  
  /* Reset print container to occupy full page */
  body, html, main, .print-container {
    background: white !important;
    color: black !important;
    font-size: 12px !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    height: auto !important;
    display: block !important;
  }

  /* Show print-only header */
  .print-header {
    display: block !important;
  }

  /* Prevent elements like cards or rows splitting across page breaks */
  .bg-white {
    border: 1px solid #e2e8f0 !important;
    box-shadow: none !important;
    page-break-inside: avoid !important;
  }

  /* Ensure page breaks cleanly before the unclaimed items table */
  .page-break-before {
    page-break-before: always !important;
  }

  table {
    page-break-inside: auto !important;
  }
  
  tr {
    page-break-inside: avoid !important;
    page-break-after: auto !important;
  }
}
</style>
