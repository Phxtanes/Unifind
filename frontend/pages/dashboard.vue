<template>
  <div class="space-y-6">

    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 pb-2 border-b border-slate-100">
      <div>
        <h1 class="text-xl font-bold text-slate-800">{{ $t('ภาพรวมระบบ Lost & Found') }}</h1>
        <p class="text-xs text-slate-500 mt-0.5">{{ $t('ภาพรวมสถานะและสถิติของระบบ') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- Period Filter -->
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs pointer-events-none">
            <font-awesome :icon="['fas', 'calendar-days']" />
          </span>
          <select v-model="selectedPeriod" class="appearance-none bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
            <option value="all">{{ $t('ช่วงเวลา: ทั้งหมด') }}</option>
            <option value="30">{{ $t('ช่วงเวลา: 30 วันล่าสุด') }}</option>
            <option value="90">{{ $t('ช่วงเวลา: 90 วันล่าสุด') }}</option>
            <option value="180">{{ $t('ช่วงเวลา: 180 วันล่าสุด') }}</option>
            <option value="365">{{ $t('ช่วงเวลา: 1 ปีล่าสุด') }}</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400 text-[10px]">
            <font-awesome :icon="['fas', 'chevron-down']" />
          </div>
        </div>

        <!-- Category Filter -->
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs pointer-events-none">
            <font-awesome :icon="['fas', 'tag']" />
          </span>
          <select v-model="selectedCategory" class="appearance-none bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
            <option value="all">{{ $t('หมวดหมู่: ทั้งหมด') }}</option>
            <option v-for="cat in itemsStore.categories" :key="cat.category_id" :value="cat.category_id">
              {{ cat.category_name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400 text-[10px]">
            <font-awesome :icon="['fas', 'chevron-down']" />
          </div>
        </div>

        <!-- Location Filter -->
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs pointer-events-none">
            <font-awesome :icon="['fas', 'location-dot']" />
          </span>
          <select v-model="selectedLocation" class="appearance-none bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
            <option value="all">{{ $t('สถานที่: ทั้งหมด') }}</option>
            <option v-for="loc in itemsStore.locations" :key="loc.location_id" :value="loc.location_id">
              {{ loc.location_name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400 text-[10px]">
            <font-awesome :icon="['fas', 'chevron-down']" />
          </div>
        </div>
      </div>
    </div>

    <!-- Horizontal Statistics Cards -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- All Items Stat Card -->
      <NuxtLink to="/items" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-slate-300/80 transition duration-300 group">
        <div class="space-y-1.5">
          <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{{ $t('รายการทั้งหมด') }}</p>
          <p class="text-3xl font-extrabold text-slate-800 group-hover:scale-102 transition-transform duration-150 inline-block">{{ filteredAllCount }}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50/50 flex items-center justify-center text-xl text-indigo-600 border border-indigo-100/50 shadow-sm">
          <font-awesome :icon="['fas', 'boxes-stacked']" />
        </div>
      </NuxtLink>

      <!-- Lost Items Stat Card -->
      <NuxtLink to="/lost" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-slate-300/80 transition duration-300 group">
        <div class="space-y-1.5">
          <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{{ $t('ของหาย (Lost)') }}</p>
          <p class="text-3xl font-extrabold text-rose-650 group-hover:scale-102 transition-transform duration-150 inline-block">{{ filteredLostCount }}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-rose-50/50 flex items-center justify-center text-xl text-rose-650 border border-rose-100/50 shadow-sm">
          <font-awesome :icon="['fas', 'briefcase']" />
        </div>
      </NuxtLink>
      
      <!-- Stored Items Stat Card -->
      <NuxtLink to="/found" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-slate-300/80 transition duration-300 group">
        <div class="space-y-1.5">
          <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{{ $t('ของพบ / ยังไม่เคลม') }}</p>
          <p class="text-3xl font-extrabold text-amber-500 group-hover:scale-102 transition-transform duration-150 inline-block">{{ filteredFoundCount }}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50/50 flex items-center justify-center text-xl text-amber-600 border border-amber-100/50 shadow-sm">
          <font-awesome :icon="['fas', 'box-archive']" />
        </div>
      </NuxtLink>
      
      <!-- Claimed Items Stat Card -->
      <NuxtLink to="/claimed" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-slate-300/80 transition duration-300 group">
        <div class="space-y-1.5">
          <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{{ $t('ส่งคืนแล้ว (Claimed)') }}</p>
          <p class="text-3xl font-extrabold text-emerald-650 group-hover:scale-102 transition-transform duration-150 inline-block">{{ filteredClaimedCount }}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50/50 flex items-center justify-center text-xl text-emerald-650 border border-emerald-100/50 shadow-sm">
          <font-awesome :icon="['fas', 'circle-check']" />
        </div>
      </NuxtLink>
    </section>

    <!-- Middle Layout Section: Status Overview & Trend Chart -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      <!-- Status Donut Chart Overview -->
      <div class="col-span-12 lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-center mb-3">
          <div>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">{{ $t('สถานะรายการ') }}</h3>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row items-center gap-8 md:gap-10 flex-1 py-1.5">
          <!-- Chart Left -->
          <div class="relative flex items-center justify-center shrink-0 w-32 h-32">
            <canvas ref="donutChartCanvas"></canvas>
            <div class="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span class="text-3xl font-black text-slate-800 leading-none">{{ totalChartCount }}</span>
              <span class="text-[10px] text-slate-400 font-bold mt-0.5">{{ $t('รายการ') }}</span>
              <span class="text-[10px] text-slate-400 font-bold leading-none">{{ $t('ทั้งหมด') }}</span>
            </div>
          </div>
          
          <!-- Legends Right -->
          <div class="flex-1 space-y-3 w-full">
            <div v-for="seg in chartSegments" :key="seg.label" class="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }"></span>
                <span class="font-semibold text-slate-600 text-xs">{{ $t(seg.label) }}</span>
              </div>
              <div class="text-right font-semibold text-slate-800 flex items-center gap-4 font-mono text-xs">
                <span>{{ seg.count }}</span>
                <span class="text-[10px] text-slate-400 font-medium font-sans w-10 text-right">{{ seg.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Monthly Statistics Chart -->
      <div class="col-span-12 lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative animate-fade-in">
        <div class="flex justify-between items-center mb-2">
          <div>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">{{ $t('สถิติรายเดือน') }}</h3>
          </div>
        </div>
        
        <div class="h-32 w-full pt-1 relative">
          <canvas ref="lineChartCanvas"></canvas>
        </div>
        
        <div class="flex justify-start gap-4 items-center text-[9px] text-slate-500 mt-2 border-t border-slate-50 pt-2 font-sans">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-sm shadow-red-200"></span> {{ $t('ของหาย (Lost)') }}</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-sm shadow-blue-200"></span> {{ $t('ของพบ / ยังไม่เคลม') }}</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm shadow-green-200"></span> {{ $t('ส่งคืนแล้ว (Claimed)') }}</span>
        </div>
      </div>
    </section>

    <!-- Bottom Layout Section: Recent Items & Recent Activity -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      <!-- Latest Items Card Grid -->
      <div class="col-span-12 lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">{{ $t('รายการล่าสุด') }}</h3>
            <p class="text-[10px] text-slate-400 mt-0.5">{{ $t('รายการของหายและของพบล่าสุด') }}</p>
          </div>
          <NuxtLink to="/items" class="text-xs font-semibold text-indigo-650 hover:text-indigo-700 hover:underline font-sans">{{ $t('ดูทั้งหมด') }}</NuxtLink>
        </div>
        
        <!-- Cards List -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div v-for="item in latestItems" :key="item.id" class="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col p-3 hover:shadow-md transition group relative overflow-hidden">
            
            <!-- Image Area -->
            <div class="relative w-full h-24 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-100">
              <!-- Type Badge -->
              <span class="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 text-[8px] font-semibold rounded text-white shadow-sm" :class="item.type === 'lost' ? 'bg-[#EF4444]' : 'bg-[#8B5CF6]'">
                {{ item.type === 'lost' ? $t('ของหาย') : $t('พบของ') }}
              </span>
              <img v-if="item.image_url || getItemImageSrc(item)" :src="item.image_url || getItemImageSrc(item)" class="w-full h-full object-cover" />
              <font-awesome v-else :icon="item.status === 'lost' ? ['fas', 'briefcase'] : ['fas', 'puzzle-piece']" class="text-xl text-slate-300" />
            </div>

            <!-- Content Area -->
            <div class="mt-2.5 flex-1 flex flex-col justify-between space-y-1.5 font-sans">
              <div class="space-y-0.5">
                <!-- Item Name -->
                <h4 class="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-650 transition" :title="item.name">
                  {{ item.name }}
                </h4>
                
                <!-- Location with pin icon -->
                <div class="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                  <font-awesome :icon="['fas', 'location-dot']" class="text-slate-400" />
                  <span class="truncate max-w-[100px]">{{ item.place }}</span>
                </div>
                
                <!-- Date/Time -->
                <div class="text-[8px] text-slate-400 font-normal flex items-center gap-1">
                  <font-awesome :icon="['fas', 'calendar-days']" class="text-slate-350" />
                  <span>{{ item.formattedDate }}</span>
                </div>
              </div>

              <!-- Bottom Status Badge -->
              <div class="pt-0.5">
                <span :class="(item.status === 'claimed' || item.status === 'returned') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'" class="inline-block px-1.5 py-0.5 text-[8px] font-bold rounded border uppercase tracking-wider">
                  {{ (item.status === 'claimed' || item.status === 'returned') ? $t('ส่งคืนแล้ว (Claimed)') : $t('รอดำเนินการ') }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="latestItems.length === 0" class="py-8 text-center text-slate-400 font-sans">
          <div class="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg mx-auto shadow-sm">
            <font-awesome :icon="['fas', 'magnifying-glass']" />
          </div>
          <p class="text-xs mt-2 font-semibold text-slate-700">{{ $t('ไม่มีรายการสิ่งของล่าสุด') }}</p>
        </div>
      </div>

      <!-- Latest Activity Timeline Card -->
      <div class="col-span-12 lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">{{ $t('กิจกรรมล่าสุด') }}</h3>
            <NuxtLink to="/items" class="text-xs font-semibold text-indigo-650 hover:text-indigo-755 hover:underline font-sans">{{ $t('ดูทั้งหมด') }}</NuxtLink>
          </div>
          
          <div class="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            <div v-for="act in latestActivities" :key="act.id" class="relative flex items-start gap-3">
              <!-- Timeline circle/icon -->
              <div :class="act.colorClass" class="absolute -left-[21px] w-5 h-5 rounded-full flex items-center justify-center text-[9px] shadow-sm z-10">
                <font-awesome :icon="['fas', act.icon]" />
              </div>
              
              <!-- Content -->
              <div class="flex-1 flex justify-between items-start gap-2 pl-3">
                <div>
                  <p class="text-[11px] font-semibold text-slate-800 leading-snug">
                    {{ act.title }}
                  </p>
                  <p v-if="act.subtitle" class="text-[9px] text-slate-400 font-medium mt-0.5">
                    {{ act.subtitle }}
                  </p>
                </div>
                <span class="text-[9px] font-semibold text-slate-450 whitespace-nowrap shrink-0 mt-0.5">
                  {{ act.time }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'
import axios from 'axios'
import dayjs from 'dayjs'
import {
  Chart,
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
)

definePageMeta({ layout: 'dashboard', title: 'แดชบอร์ดระบบ', icon: 'house' })

const itemsStore = useItemsStore()
const { formatDate, getItemImageSrc } = useItemHelpers()

const selectedPeriod = ref('180')
const selectedCategory = ref('all')
const selectedLocation = ref('all')

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

const authStore = useAuthStore()
const config = useRuntimeConfig()

// Format Thai Date and Time like "24 มิ.ย. 68 | 14:10 น."
const formatThaiDateTime = (dateStr: any) => {
  if (!dateStr) return 'ไม่ระบุ'
  const d = dayjs(dateStr)
  const shortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const day = d.date()
  const month = shortMonths[d.month()]
  // Show Buddhist Era Year in 2 digits (e.g. 2025 is 2568 -> 68, 2026 is 2569 -> 69)
  const yearBE = (d.year() + 543) % 100
  const time = d.format('HH:mm')
  return `${day} ${month} ${yearBE} | ${time} น.`
}

const donutChartCanvas = ref<HTMLCanvasElement | null>(null)
const lineChartCanvas = ref<HTMLCanvasElement | null>(null)

let donutChartInstance: Chart | null = null
let lineChartInstance: Chart | null = null

const triggerCreateModal = () => {
  window.dispatchEvent(new CustomEvent('open-create-modal'))
}

// Filtered items based on Category and Location (useful for monthly stats where we want historical data of that category/location)
const filteredItemsExcludingPeriod = computed(() => {
  let list = itemsStore.items

  // Filter by Category
  if (selectedCategory.value !== 'all') {
    const catId = parseInt(selectedCategory.value, 10)
    list = list.filter(item => item.category_id === catId || String(item.category_id) === selectedCategory.value)
  }

  // Filter by Location
  if (selectedLocation.value !== 'all') {
    const locId = parseInt(selectedLocation.value, 10)
    list = list.filter(item => item.location_id === locId || String(item.location_id) === selectedLocation.value)
  }

  return list
})

// Fully filtered items (including Period)
const filteredItems = computed(() => {
  let list = filteredItemsExcludingPeriod.value

  // Filter by Period
  if (selectedPeriod.value !== 'all') {
    const days = parseInt(selectedPeriod.value, 10)
    if (!isNaN(days)) {
      const cutOff = dayjs().subtract(days, 'day')
      list = list.filter(item => {
        const itemDate = dayjs(item.date || item.created_at)
        return itemDate.isAfter(cutOff)
      })
    }
  }

  return list
})

const filteredAllCount = computed(() => filteredItems.value.length)
const filteredLostCount = computed(() => filteredItems.value.filter(i => i.status === 'lost').length)
const filteredFoundCount = computed(() => filteredItems.value.filter(i => i.status === 'found' || i.status === 'stored').length)
const filteredClaimedCount = computed(() => filteredItems.value.filter(i => i.status === 'claimed' || i.status === 'returned').length)

// Calculate the number of items created in the last 30 days
const getTrend = (type: string) => {
  const thirtyDaysAgo = dayjs().subtract(30, 'day')
  let list = filteredItems.value
  if (type === 'all') {
    return list.filter(item => dayjs(item.created_at || item.date).isAfter(thirtyDaysAgo)).length
  } else if (type === 'lost') {
    return list.filter(item => item.status === 'lost' && dayjs(item.created_at || item.date).isAfter(thirtyDaysAgo)).length
  } else if (type === 'found') {
    return list.filter(item => (item.status === 'found' || item.status === 'stored') && dayjs(item.created_at || item.date).isAfter(thirtyDaysAgo)).length
  } else if (type === 'claimed') {
    return list.filter(item => (item.status === 'claimed' || item.status === 'returned') && dayjs(item.created_at || item.date).isAfter(thirtyDaysAgo)).length
  }
  return 0
}

onMounted(async () => {
  if (itemsStore.items.length === 0) {
    await itemsStore.fetchItems()
  }
  lastUpdated.value = itemsStore.lastUpdated || new Date()
  updateLastUpdatedText()

  initCharts()

  // ตรวจสอบและเชื่อมโยงบัญชี LINE หากมี pendingLineUserId
  const pendingLineUserId = localStorage.getItem('pendingLineUserId')
  if (authStore.isAuthenticated && pendingLineUserId) {
    try {
      await axios.post(`${config.public.apiBaseUrl}/auth/bind-line`, { lineUserId: pendingLineUserId }, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      localStorage.removeItem('pendingLineUserId')
      alert('ผูกบัญชี LINE เข้ากับระบบ Unifind สำเร็จเรียบร้อยแล้ว!')
    } catch (err) {
      console.error('Failed to bind LINE account:', err)
    }
  }
})

const chartSegments = computed(() => {
  const lost = filteredLostCount.value
  const foundStored = filteredFoundCount.value
  const claimed = filteredClaimedCount.value

  const total = lost + foundStored + claimed

  const categories = [
    { label: 'ของหาย (Lost)', count: lost, color: '#EF4444' },
    { label: 'ของพบ / ยังไม่เคลม', count: foundStored, color: '#8B5CF6' },
    { label: 'ส่งคืนแล้ว (Claimed)', count: claimed, color: '#10B981' }
  ]
  
  return categories.map(cat => {
    const percent = total > 0 ? Math.round((cat.count / total) * 100) : 0
    return {
      ...cat,
      percent
    }
  })
})

const totalChartCount = computed(() => {
  return chartSegments.value.reduce((acc, cur) => acc + cur.count, 0)
})

// Latest Items computed list
const latestItems = computed(() => {
  return [...filteredItems.value]
    .sort((a, b) => new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime())
    .map(item => {
      let statusLabel = 'กำลังตามหา'
      let badgeClass = 'bg-[#FBBF24] text-white' // Yellow
      if (item.status === 'stored' || item.status === 'found') {
        statusLabel = 'เก็บไว้ในคลัง'
        badgeClass = 'bg-[#8B5CF6] text-white' // Purple
      } else if (item.status === 'claimed' || item.status === 'returned') {
        statusLabel = 'ส่งคืนแล้ว'
        badgeClass = 'bg-[#10B981] text-white' // Green
      }
      return {
        ...item,
        statusLabel,
        badgeClass,
        formattedDate: formatThaiDateTime(item.date)
      }
    })
    .slice(0, 5)
})

// Latest Activity computed timeline list
const latestActivities = computed(() => {
  const list = []
  const dbItems = [...filteredItems.value].sort((a, b) => new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime())

  for (const item of dbItems) {
    const timeStr = dayjs(item.date).format('HH:mm') + ' น.'
    const staff = item.staffName || 'เจ้าหน้าที่'
    if (item.status === 'claimed' || item.status === 'returned') {
      list.push({
        id: `db-act-claim-${item.id}`,
        title: `ส่งคืน "${item.name}" ให้${item.claimerName || 'เจ้าของ'}`,
        subtitle: `โดย ${staff}`,
        time: timeStr,
        icon: 'circle-check',
        colorClass: 'bg-[#10B981] text-white',
        borderClass: 'border-[#10B981]'
      })
    } else if (item.status === 'stored' || item.status === 'found') {
      list.push({
        id: `db-act-new-${item.id}`,
        title: `บันทึกของพบใหม่ "${item.name}"`,
        subtitle: `โดย ${staff}`,
        time: timeStr,
        icon: 'briefcase',
        colorClass: 'bg-[#8B5CF6] text-white',
        borderClass: 'border-[#8B5CF6]'
      })
    } else if (item.status === 'lost') {
      list.push({
        id: `db-act-update-${item.id}`,
        title: `อัปเดตสถานะเป็น "กำลังตามหา" "${item.name}"`,
        subtitle: item.reporterName ? `โดย ${item.reporterName}` : '',
        time: timeStr,
        icon: 'magnifying-glass',
        colorClass: 'bg-[#FBBF24] text-white',
        borderClass: 'border-[#FBBF24]'
      })
    }
  }

  return list.slice(0, 5)
})

// Monthly Statistics data plotting
const monthlyStats = computed(() => {
  const shortMonths = ['พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.']
  const data = []
  const now = dayjs()
  
  for (let i = 5; i >= 0; i--) {
    const targetMonth = now.subtract(i, 'month')
    const monthIndex = targetMonth.month()
    const monthName = shortMonths[monthIndex] || shortMonths[0]
    
    // Filter items belonging to this month/year from filteredItemsExcludingPeriod
    const itemsInMonth = filteredItemsExcludingPeriod.value.filter(item => {
      const d = dayjs(item.date || item.created_at)
      return d.month() === monthIndex && d.year() === targetMonth.year()
    })

    const lostItemsInMonth = itemsInMonth.filter(item => item.type === 'lost')
    const foundItemsInMonth = itemsInMonth.filter(item => item.type === 'found' && (item.status === 'found' || item.status === 'stored'))
    const claimedItemsInMonth = itemsInMonth.filter(item => item.status === 'claimed' || item.status === 'returned')

    const lostH1 = lostItemsInMonth.filter(item => dayjs(item.date || item.created_at).date() <= 15).length
    const foundH1 = foundItemsInMonth.filter(item => dayjs(item.date || item.created_at).date() <= 15).length
    const claimedH1 = claimedItemsInMonth.filter(item => dayjs(item.date || item.created_at).date() <= 15).length

    const lostH2 = lostItemsInMonth.filter(item => dayjs(item.date || item.created_at).date() > 15).length
    const foundH2 = foundItemsInMonth.filter(item => dayjs(item.date || item.created_at).date() > 15).length
    const claimedH2 = claimedItemsInMonth.filter(item => dayjs(item.date || item.created_at).date() > 15).length

    data.push({
      periodLabel: `${monthName} 69`,
      lost: lostH1,
      found: foundH1,
      claimed: claimedH1
    })
    data.push({
      periodLabel: `${monthName} 69`,
      lost: lostH2,
      found: foundH2,
      claimed: claimedH2
    })
  }

  const finalData = data.map((d) => {
    return {
      periodLabel: d.periodLabel,
      lost: d.lost,
      found: d.found,
      claimed: d.claimed
    }
  })

  const maxVal = Math.max(...finalData.map(d => Math.max(d.lost, d.found, d.claimed)), 10)

  return {
    maxVal,
    monthsData: finalData
  }
})

const initCharts = () => {
  if (donutChartInstance) donutChartInstance.destroy()
  if (lineChartInstance) lineChartInstance.destroy()

  const segments = chartSegments.value
  const total = totalChartCount.value

  // Initialize Donut Chart
  if (donutChartCanvas.value) {
    donutChartInstance = new Chart(donutChartCanvas.value, {
      type: 'doughnut',
      data: {
        labels: segments.map(s => s.label),
        datasets: [{
          data: segments.map(s => s.count),
          backgroundColor: segments.map(s => s.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context: any) => {
                const count = context.raw as number
                const percent = total > 0 ? Math.round((count / total) * 100) : 0
                return ` ${context.label}: ${count} รายการ (${percent}%)`
              }
            }
          }
        }
      }
    })
  }

  // Initialize Line Chart
  if (lineChartCanvas.value) {
    const stats = monthlyStats.value
    const ctx = lineChartCanvas.value.getContext('2d')
    let lostGradient: CanvasGradient | string = '#EF4444'
    let foundGradient: CanvasGradient | string = '#3B82F6'
    let claimedGradient: CanvasGradient | string = '#10B981'

    if (ctx) {
      lostGradient = ctx.createLinearGradient(0, 0, 0, 150)
      lostGradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)')
      lostGradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)')

      foundGradient = ctx.createLinearGradient(0, 0, 0, 150)
      foundGradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)')
      foundGradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)')

      claimedGradient = ctx.createLinearGradient(0, 0, 0, 150)
      claimedGradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)')
      claimedGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)')
    }

    lineChartInstance = new Chart(lineChartCanvas.value, {
      type: 'line',
      data: {
        labels: stats.monthsData.map(d => d.periodLabel.split(' ')[0]),
        datasets: [
          {
            label: 'ของหาย (Lost)',
            data: stats.monthsData.map(d => d.lost),
            borderColor: '#EF4444',
            backgroundColor: lostGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#EF4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 2.5,
            pointHoverRadius: 4.5
          },
          {
            label: 'ของพบ / ยังไม่เคลม',
            data: stats.monthsData.map(d => d.found),
            borderColor: '#3B82F6',
            backgroundColor: foundGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 2.5,
            pointHoverRadius: 4.5
          },
          {
            label: 'ส่งคืนแล้ว (Claimed)',
            data: stats.monthsData.map(d => d.claimed),
            borderColor: '#10B981',
            backgroundColor: claimedGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 2.5,
            pointHoverRadius: 4.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#94A3B8',
              font: { size: 9, weight: 'bold' }
            }
          },
          y: {
            grid: {
              color: '#F1F5F9'
            },
            ticks: {
              color: '#94A3B8',
              font: { size: 9, weight: 'bold' },
              stepSize: Math.max(1, Math.round(stats.maxVal / 5))
            },
            min: 0,
            max: stats.maxVal
          }
        }
      }
    })
  }
}

watch(filteredItems, () => {
  initCharts()
}, { deep: true })

onBeforeUnmount(() => {
  if (donutChartInstance) donutChartInstance.destroy()
  if (lineChartInstance) lineChartInstance.destroy()
})
</script>
