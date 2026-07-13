<template>
  <div class="space-y-6">

    <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div class="pt-6 mb-6">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">ผังการจัดเก็บตู้ล็อกเกอร์ (Locker Room Map)</h3>
        <p class="text-xs text-slate-400 mt-1">ตู้ L01–L12 ตามเดือน — แต่ละตู้มี 2 ชั้น (01, 02) รวม 24 ช่อง — คลิกชั้นเพื่อดูรายการสิ่งของ</p>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-emerald-600">{{ totalEmptySlots }}</p>
          <p class="text-xs text-emerald-700 font-semibold mt-1">ช่องว่าง</p>
        </div>
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-amber-600">{{ totalOccupiedSlots }}</p>
          <p class="text-xs text-amber-700 font-semibold mt-1">ช่องที่ใช้งาน</p>
        </div>
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-slate-700">24</p>
          <p class="text-xs text-slate-600 font-semibold mt-1">ช่องทั้งหมด (12 ตู้ × 2 ชั้น)</p>
        </div>
      </div>

      <!-- 12 Lockers Grid (L01–L12) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="locker in lockersList"
          :key="locker.lockerId"
          class="border border-slate-200/80 rounded-2xl p-4 shadow-sm bg-white hover:shadow-md transition-all duration-200"
        >
          <!-- Locker Header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 border border-slate-200">
                <font-awesome :icon="['fas', 'box-archive']" class="text-slate-500 text-[11px]" />
              </span>
              <div>
                <h4 class="text-xs font-black text-slate-800 font-mono">{{ locker.lockerId }}</h4>
                <p class="text-[9px] text-slate-400 font-medium">{{ locker.monthName }}</p>
              </div>
            </div>
            <span
              :class="locker.floors.some(f => f.status === 'occupied') ? 'text-amber-500' : 'text-emerald-500'"
              class="text-[9px] font-bold uppercase tracking-wider"
            >
              {{ locker.floors.filter(f => f.status === 'occupied').length }}/2
            </span>
          </div>

          <!-- 2 Floor Slots -->
          <div class="space-y-2">
            <div
              v-for="floor in locker.floors"
              :key="floor.floorId"
              @click="selectFloor(floor)"
              :class="{
                'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 cursor-pointer': floor.status === 'empty',
                'border-amber-200 bg-amber-50/60 hover:bg-amber-50 cursor-pointer': floor.status === 'occupied'
              }"
              class="flex items-center justify-between rounded-xl px-3 py-2 border transition-all duration-150 select-none"
            >
              <div class="flex items-center gap-2">
                <span
                  :class="{
                    'bg-emerald-100 text-emerald-700': floor.status === 'empty',
                    'bg-amber-100 text-amber-700': floor.status === 'occupied'
                  }"
                  class="text-[9px] font-black px-1.5 py-0.5 rounded font-mono"
                >
                  {{ floor.floorId }}
                </span>
                <span class="text-[10px] font-semibold text-slate-600">ชั้น {{ floor.floorNum }}</span>
              </div>

              <div class="flex items-center gap-1.5">
                <span v-if="floor.status === 'occupied'" class="text-[9px] font-bold text-amber-700">
                  {{ floor.items.length }} รายการ
                </span>
                <span
                  :class="{
                    'bg-emerald-100 text-emerald-800 border-emerald-200': floor.status === 'empty',
                    'bg-amber-100 text-amber-800 border-amber-200': floor.status === 'occupied'
                  }"
                  class="px-1.5 py-0.5 text-[8px] font-bold rounded-full border uppercase tracking-wider"
                >
                  {{ floor.status === 'empty' ? 'ว่าง' : 'เก็บของ' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floor Detail Modal -->
    <div
      v-if="showLockerModal && selectedFloor"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60  animate-fade-in"
      @click.self="showLockerModal = false"
    >
      <div class="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-100 overflow-hidden animate-scale-up">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600">
              <font-awesome :icon="['fas', 'box-archive']" class="text-sm" />
            </span>
            <div>
              <h3 class="text-sm font-bold text-slate-800 font-mono">{{ selectedFloor.floorId }}</h3>
              <p class="text-[10px] text-slate-500 font-medium">
                ชั้น {{ selectedFloor.floorNum }} — {{ selectedFloor.items.length }} รายการในช่องนี้
              </p>
            </div>
          </div>
          <button @click="showLockerModal = false" class="text-slate-400 hover:text-slate-650 hover:bg-slate-100 p-1.5 rounded-lg transition">
            <font-awesome :icon="['fas', 'xmark']" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 max-h-[450px] overflow-y-auto">
          <!-- Empty State -->
          <div v-if="selectedFloor.items.length === 0" class="text-center py-12">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg mx-auto shadow-sm mb-4">
              <font-awesome :icon="['fas', 'check-double']" />
            </div>
            <h4 class="text-xs font-bold text-slate-700">ไม่มีสิ่งของในชั้นนี้</h4>
            <p class="text-[10px] text-slate-400 mt-1 font-medium">ช่องล็อกเกอร์ {{ selectedFloor.floorId }} ยังว่างอยู่ พร้อมสำหรับจัดเก็บสิ่งของที่พบเจอใหม่</p>
          </div>

          <!-- Items List -->
          <div v-else class="space-y-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-bold text-slate-450 uppercase tracking-wider">รายการสิ่งของที่จัดเก็บ ({{ selectedFloor.items.length }})</span>
            </div>
            <div class="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <div
                v-for="item in selectedFloor.items"
                :key="item.id"
                class="p-4 bg-white hover:bg-slate-50/50 flex gap-4 transition duration-150"
              >
                <!-- Item Image -->
                <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" />
                <div v-else class="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150 font-bold shadow-sm shrink-0">
                  <font-awesome :icon="['fas', 'image']" class="text-lg" />
                </div>

                <!-- Item Details -->
                <div class="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div class="flex items-start justify-between gap-2">
                      <h4 class="font-bold text-slate-800 text-xs truncate" :title="item.name">{{ item.name }}</h4>
                      <span class="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-100/50 uppercase tracking-wider shrink-0">
                        {{ translateCategory(item.category) }}
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed" v-if="item.description">{{ formatDescription(item.description) }}</p>
                    <p class="text-[10px] text-slate-400 italic mt-1" v-else>ไม่มีรายละเอียดคำอธิบายของ</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100/60 text-[9px] text-slate-450 font-medium font-mono">
                    <span>ID: {{ getMockCode(item) }}</span>
                    <span>ผู้พบ/ส่ง: {{ item.finderName || item.founder || 'ไม่ได้ระบุ' }}</span>
                    <span>วันที่พบ: {{ formatDate(item.date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex justify-end">
          <button @click="showLockerModal = false" class="px-4 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 hover:border-slate-350 text-slate-650 text-xs font-bold rounded-xl transition duration-150 shadow-sm">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'

definePageMeta({ layout: 'dashboard', title: 'ตู้เก็บของ (Lockers)', icon: 'database' })

const itemsStore = useItemsStore()
const { formatDate, translateCategory, getMockCode, getItemImageSrc, formatDescription } = useItemHelpers()

const selectedFloor = ref<any>(null)
const showLockerModal = ref(false)

const selectFloor = (floor: any) => {
  selectedFloor.value = floor
  showLockerModal.value = true
}

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const lockersList = computed(() => {
  // Build a lookup map: locker_id → items (only stored/found status)
  const lockerMap: Record<string, any[]> = {}
  for (const item of itemsStore.items) {
    if (item.locker_id && (item.status === 'stored' || item.status === 'found')) {
      const key = item.locker_id as string
      if (!lockerMap[key]) lockerMap[key] = []
      lockerMap[key].push(item)
    }
  }

  // Always build all 12 lockers (L01–L12), each with 2 floors (01, 02)
  return Array.from({ length: 12 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0')
    const slot01 = lockerMap[`L${num}01`] || []
    const slot02 = lockerMap[`L${num}02`] || []
    return {
      lockerId: `L${num}`,
      monthName: MONTH_NAMES[i],
      floors: [
        {
          floorId: `L${num}01`,
          floorNum: '01',
          items: slot01,
          status: slot01.length > 0 ? 'occupied' : 'empty'
        },
        {
          floorId: `L${num}02`,
          floorNum: '02',
          items: slot02,
          status: slot02.length > 0 ? 'occupied' : 'empty'
        }
      ]
    }
  })
})

const totalOccupiedSlots = computed(() =>
  lockersList.value.reduce((acc, l) => acc + l.floors.filter(f => f.status === 'occupied').length, 0)
)

const totalEmptySlots = computed(() =>
  lockersList.value.reduce((acc, l) => acc + l.floors.filter(f => f.status === 'empty').length, 0)
)
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
