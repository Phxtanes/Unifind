<template>
  <div class="space-y-6">

    <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div class="pt-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">{{ langStore.t('ผังการจัดเก็บตู้ล็อกเกอร์ (Locker Room Map)') }}</h3>
          <p class="text-xs text-slate-400 mt-1">{{ langStore.t('ตู้ L01–L12 ตามเดือน และตู้เพิ่มเติม —แต่ละตู้มี 2 ชั้น (01, 02) — คลิกชั้นเพื่อดูรายการสิ่งของ') }}</p>
        </div>
        <button
          @click="addLocker"
          class="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <font-awesome :icon="['fas', 'plus']" class="text-[10px]" />
          {{ langStore.t('เพิ่มตู้ล็อกเกอร์') }}
        </button>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-emerald-600">{{ totalEmptySlots }}</p>
          <p class="text-xs text-emerald-700 font-semibold mt-1">{{ langStore.t('ช่องว่าง') }}</p>
        </div>
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-amber-600">{{ totalOccupiedSlots }}</p>
          <p class="text-xs text-amber-700 font-semibold mt-1">{{ langStore.t('ช่องที่ใช้งาน') }}</p>
        </div>
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-slate-700">{{ lockersList.length * 2 }}</p>
          <p class="text-xs text-slate-600 font-semibold mt-1">
            {{ langStore.t('ช่องทั้งหมด ({count} ตู้ × 2 ชั้น)', { count: lockersList.length }) }}
          </p>
        </div>
      </div>

      <!-- Lockers Grid -->
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
                <p class="text-[9px] text-slate-400 font-medium">{{ getLocalizedLockerLabel(locker.monthName) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="locker.isCustom && locker.floors.every(f => f.items.length === 0)"
                @click.stop="removeLocker(locker.lockerId)"
                class="text-slate-300 hover:text-rose-500 p-1 hover:bg-rose-50 rounded transition"
                :title="langStore.t('ลบตู้ล็อกเกอร์นี้')"
              >
                <font-awesome :icon="['fas', 'trash-can']" class="text-[10px]" />
              </button>
              <span
                :class="locker.floors.some(f => f.status === 'occupied') ? 'text-amber-500' : 'text-emerald-500'"
                class="text-[9px] font-bold uppercase tracking-wider"
              >
                {{ locker.floors.filter(f => f.status === 'occupied').length }}/2
              </span>
            </div>
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
                <span class="text-[10px] font-semibold text-slate-600">
                  {{ langStore.t('ชั้น {num}', { num: floor.floorNum }) }}
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <span v-if="floor.status === 'occupied'" class="text-[9px] font-bold text-amber-700 font-sans">
                  {{ langStore.t('{count} รายการ', { count: floor.items.length }) }}
                </span>
                <span
                  :class="{
                    'bg-emerald-100 text-emerald-800 border-emerald-200': floor.status === 'empty',
                    'bg-amber-100 text-amber-800 border-amber-200': floor.status === 'occupied'
                  }"
                  class="px-1.5 py-0.5 text-[8px] font-bold rounded-full border uppercase tracking-wider"
                >
                  {{ floor.status === 'empty' ? langStore.t('ว่าง') : langStore.t('ใช้งานอยู่') }}
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
            <span class="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-650">
              <font-awesome :icon="['fas', 'box-archive']" class="text-sm" />
            </span>
            <div>
              <h3 class="text-sm font-bold text-slate-800 font-mono">
                {{ langStore.t('รายละเอียดช่องเก็บของ {id}', { id: selectedFloor.floorId }) }}
              </h3>
              <p class="text-[10px] text-slate-500 font-medium font-sans">
                {{ langStore.t('ชั้น {floor} — {count} รายการในช่องนี้', { floor: selectedFloor.floorNum, count: selectedFloor.items.length }) }}
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
            <h4 class="text-xs font-bold text-slate-700">{{ langStore.t('ช่องล็อกเกอร์ยังว่างอยู่') }}</h4>
            <p class="text-[10px] text-slate-400 mt-1 font-medium font-sans">
              {{ langStore.t('ช่องล็อกเกอร์ {id} ยังว่างอยู่ พร้อมสำหรับจัดเก็บสิ่งของที่พบเจอใหม่', { id: selectedFloor.floorId }) }}
            </p>
          </div>

          <!-- Items List -->
          <div v-else class="space-y-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-sans">
                {{ langStore.t('รายการสิ่งของที่จัดเก็บ ({count})', { count: selectedFloor.items.length }) }}
              </span>
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
                      <span class="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-100/50 uppercase tracking-wider shrink-0 font-sans">
                        {{ translateCategory(item.category) }}
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-sans" v-if="item.description">{{ formatDescription(item.description) }}</p>
                    <p class="text-[10px] text-slate-400 italic mt-1 font-sans" v-else>{{ langStore.t('ไม่มีรายละเอียดคำอธิบายของ') }}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100/60 text-[9px] text-slate-450 font-medium font-mono">
                    <span>ID: {{ getMockCode(item) }}</span>
                    <span class="font-sans">{{ langStore.locale === 'th' ? 'ผู้พบ/ส่ง:' : 'Finder:' }} {{ item.finderName || item.founder || 'N/A' }}</span>
                    <span class="font-sans">{{ langStore.locale === 'th' ? 'วันที่พบ:' : 'Date Found:' }} {{ formatDate(item.date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex justify-end">
          <button @click="showLockerModal = false" class="px-4 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 hover:border-slate-350 text-slate-650 text-xs font-bold rounded-xl transition duration-150 shadow-sm">
            {{ langStore.t('ปิด') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Locker Modal -->
    <div
      v-if="showAddLockerModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fade-in"
      @click.self="closeAddLockerModal"
    >
      <div class="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden animate-scale-up">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-650">
              <font-awesome :icon="['fas', 'plus']" class="text-xs" />
            </span>
            <div>
              <h3 class="text-xs font-bold text-slate-800">{{ langStore.t('เพิ่มตู้ล็อกเกอร์ใหม่') }}</h3>
              <p class="text-[9px] text-slate-400 font-medium">{{ langStore.t('เพิ่มพื้นที่จัดเก็บใหม่ให้กับระบบ') }}</p>
            </div>
          </div>
          <button @click="closeAddLockerModal" class="text-slate-450 hover:text-slate-650 hover:bg-slate-100 p-1.5 rounded-lg transition">
            <font-awesome :icon="['fas', 'xmark']" />
          </button>
        </div>

        <!-- Modal Content (Form) -->
        <form @submit.prevent="submitAddLocker" class="p-6 space-y-4">
          <div>
            <label for="new-locker-number" class="block text-xs font-bold text-slate-650 mb-1.5">
              {{ langStore.t('รหัสตู้ล็อกเกอร์') }} <span class="text-red-500">*</span>
            </label>
            <div class="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-100 transition bg-slate-50/50 hover:bg-slate-50/85">
              <span class="inline-flex items-center px-4 bg-slate-100 border-r border-slate-200 text-xs font-black text-slate-500 select-none">
                L
              </span>
              <input
                id="new-locker-number"
                v-model="newLockerNumber"
                type="text"
                required
                :placeholder="langStore.t('กรอกหมายเลขตู้ เช่น 13, 14, 15')"
                @input="newLockerNumber = newLockerNumber.replace(/\D/g, '')"
                class="flex-1 min-w-0 pl-3 pr-4 py-2.5 bg-transparent outline-none text-xs text-slate-700 font-semibold transition"
              />
            </div>
          </div>

          <div>
            <label for="new-locker-label" class="block text-xs font-bold text-slate-650 mb-1.5">
              {{ langStore.t('ป้ายกำกับ / คำอธิบายตู้') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <select
                id="new-locker-label"
                v-model="newLockerLabel"
                required
                class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition"
              >
                <option value="" disabled>{{ langStore.t('เลือกเดือนหรือป้ายกำกับ') }}</option>
                <option v-for="m in currentMonthNames" :key="m" :value="m">{{ m }}</option>
                <option value="ตู้เพิ่มเติม">{{ langStore.locale === 'th' ? 'ตู้เพิ่มเติม' : 'Extra Locker' }}</option>
                <option value="ตู้เก็บของพิเศษ">{{ langStore.locale === 'th' ? 'ตู้เก็บของพิเศษ' : 'Special Locker' }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
              </div>
            </div>
          </div>

          <!-- Alert error message if any -->
          <p v-if="addLockerError" class="text-[10px] text-rose-500 font-bold flex items-center gap-1">
            <font-awesome :icon="['fas', 'circle-exclamation']" />
            {{ addLockerError }}
          </p>

          <!-- Modal Footer -->
          <div class="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              @click="closeAddLockerModal"
              class="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition duration-150"
            >
              {{ langStore.t('ยกเลิก') }}
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition"
            >
              {{ langStore.t('บันทึกตู้ใหม่') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'
import { useLangStore } from '~/stores/lang'

interface LockerFloor {
  floorId: string
  floorNum: string
  items: any[]
  status: 'occupied' | 'empty'
}

interface Locker {
  lockerId: string
  monthName: string
  isCustom: boolean
  floors: LockerFloor[]
}

definePageMeta({ layout: 'dashboard', title: 'ตู้เก็บของ (Lockers)', icon: 'database' })

const itemsStore = useItemsStore()
const langStore = useLangStore()
const { formatDate, translateCategory, getMockCode, getItemImageSrc, formatDescription } = useItemHelpers()

const selectedFloor = ref<any>(null)
const showLockerModal = ref(false)

const selectFloor = (floor: any) => {
  selectedFloor.value = floor
  showLockerModal.value = true
}

const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
]

const currentMonthNames = computed(() => {
  return langStore.locale === 'th' ? MONTH_NAMES_TH : MONTH_NAMES_EN
})

const getLocalizedLockerLabel = (label: string) => {
  const idx = MONTH_NAMES_TH.indexOf(label)
  if (idx !== -1) {
    return currentMonthNames.value[idx]
  }
  if (label === 'ตู้เพิ่มเติม') return langStore.locale === 'th' ? 'ตู้เพิ่มเติม' : 'Extra Locker'
  if (label === 'ตู้เก็บของพิเศษ') return langStore.locale === 'th' ? 'ตู้เก็บของพิเศษ' : 'Special Locker'
  return label
}

const customLockers = ref<{ lockerId: string; label: string }[]>([])
const showAddLockerModal = ref(false)
const newLockerNumber = ref('')
const newLockerLabel = ref('')
const addLockerError = ref('')

onMounted(() => {
  if (process.client) {
    const saved = localStorage.getItem('unifind_custom_lockers')
    if (saved) {
      try {
        customLockers.value = JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
  }
})

const addLocker = () => {
  newLockerNumber.value = ''
  newLockerLabel.value = ''
  addLockerError.value = ''
  showAddLockerModal.value = true
}

const closeAddLockerModal = () => {
  showAddLockerModal.value = false
}

const submitAddLocker = () => {
  addLockerError.value = ''
  const num = newLockerNumber.value.trim()
  if (!num) {
    addLockerError.value = langStore.t('กรุณากรอกหมายเลขตู้')
    return
  }

  // Auto pad single digit, e.g. '3' -> '03', '13' -> '13'
  const paddedNum = num.padStart(2, '0')
  const code = `L${paddedNum}`

  const allIds = new Set<string>()
  for (let i = 1; i <= 12; i++) {
    allIds.add(`L${String(i).padStart(2, '0')}`)
  }
  customLockers.value.forEach(cl => allIds.add(cl.lockerId))

  if (allIds.has(code)) {
    addLockerError.value = langStore.t('รหัสตู้ล็อกเกอร์ {id} มีอยู่ในระบบแล้ว', { id: code })
    return
  }

  customLockers.value.push({
    lockerId: code,
    label: newLockerLabel.value.trim()
  })

  if (process.client) {
    localStorage.setItem('unifind_custom_lockers', JSON.stringify(customLockers.value))
  }
  showAddLockerModal.value = false
}

const removeLocker = (lockerId: string) => {
  if (!confirm(langStore.t('ต้องการลบตู้ล็อกเกอร์ {id} หรือไม่?', { id: lockerId }))) return
  customLockers.value = customLockers.value.filter(l => l.lockerId !== lockerId)
  if (process.client) {
    localStorage.setItem('unifind_custom_lockers', JSON.stringify(customLockers.value))
  }
}

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

  // 12 Standard monthly lockers
  const list: Locker[] = Array.from({ length: 12 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0')
    const lockerId = `L${num}`
    const slot01 = lockerMap[`${lockerId}01`] || []
    const slot02 = lockerMap[`${lockerId}02`] || []
    return {
      lockerId,
      monthName: MONTH_NAMES_TH[i],
      isCustom: false,
      floors: [
        {
          floorId: `${lockerId}01`,
          floorNum: '01',
          items: slot01,
          status: slot01.length > 0 ? 'occupied' : 'empty'
        },
        {
          floorId: `${lockerId}02`,
          floorNum: '02',
          items: slot02,
          status: slot02.length > 0 ? 'occupied' : 'empty'
        }
      ]
    }
  })

  // Merge with custom lockers in localStorage + dynamically discovered from items
  const registeredCustomIds = new Set(customLockers.value.map(l => l.lockerId))
  
  // Discover from items
  for (const item of itemsStore.items) {
    if (item.locker_id) {
      const match = item.locker_id.match(/^L(\d+)(\d{2})$/)
      if (match) {
        const id = `L${match[1]}`
        const numVal = parseInt(match[1], 10)
        if (numVal > 12 && !registeredCustomIds.has(id)) {
          // Add dynamically so they display even if not in localStorage of this user
          customLockers.value.push({ lockerId: id, label: `ตู้เพิ่มเติม ${id}` })
          registeredCustomIds.add(id)
          if (process.client) {
            localStorage.setItem('unifind_custom_lockers', JSON.stringify(customLockers.value))
          }
        }
      }
    }
  }

  // Sort custom lockers by ID numerically
  const sortedCustom = [...customLockers.value].sort((a, b) => {
    const numA = parseInt(a.lockerId.replace('L', ''), 10)
    const numB = parseInt(b.lockerId.replace('L', ''), 10)
    return numA - numB
  })

  sortedCustom.forEach(cl => {
    const slot01 = lockerMap[`${cl.lockerId}01`] || []
    const slot02 = lockerMap[`${cl.lockerId}02`] || []
    list.push({
      lockerId: cl.lockerId,
      monthName: cl.label,
      isCustom: true,
      floors: [
        {
          floorId: `${cl.lockerId}01`,
          floorNum: '01',
          items: slot01,
          status: slot01.length > 0 ? 'occupied' : 'empty'
        },
        {
          floorId: `${cl.lockerId}02`,
          floorNum: '02',
          items: slot02,
          status: slot02.length > 0 ? 'occupied' : 'empty'
        }
      ]
    })
  })

  return list
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
