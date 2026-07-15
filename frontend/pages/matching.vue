<template>
  <div class="space-y-6">
    <!-- Header Summary -->
    <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm select-none">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            <font-awesome :icon="['fas', 'robot']" class="text-indigo-600 animate-bounce" />
            {{ $t('AI Matching Center (ศูนย์วิเคราะห์และจับคู่สิ่งของหาย)') }}
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-1">{{ $t('เปรียบเทียบสิ่งของที่แจ้งหายและของที่พบในระบบด้วย Gemini AI วิเคราะห์ความน่าจะเป็นในการจับคู่แบบสองทิศทาง') }}</p>
        </div>
        
        <!-- Active Count Stats -->
        <div class="flex gap-4 self-start md:self-auto">
          <div class="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 text-center">
            <span class="text-xs text-rose-700 font-bold font-mono">{{ activeLostItems.length }}</span>
            <p class="text-[10px] text-rose-550 font-bold mt-0.5">{{ $t('ของหายรอคู่') }}</p>
          </div>
          <div class="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center">
            <span class="text-xs text-emerald-700 font-bold font-mono">{{ activeFoundItems.length }}</span>
            <p class="text-[10px] text-emerald-550 font-bold mt-0.5">{{ $t('ของในคลังรอคืน') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Workspace Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      <!-- Left Column: Lost Items list (xl:col-span-4) -->
      <div class="xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[680px]">
        <div class="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <font-awesome :icon="['fas', 'briefcase']" class="text-rose-550" />
            {{ $t('1. เลือกรายการของหาย (Lost Items)') }}
          </h3>
          <!-- Search box -->
          <div class="relative mt-3">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
              <font-awesome :icon="['fas', 'magnifying-glass']" />
            </span>
            <input v-model="lostSearchQuery" type="text" :placeholder="$t('ค้นหาของหาย...')"
              class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-250 rounded-xl focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-slate-700 transition" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          <div v-for="item in filteredLostItems" :key="item.id" 
            @click="selectLostItem(item)"
            :class="[
              selectedLost && selectedLost.id === item.id 
                ? 'bg-rose-50/80 border-rose-250 shadow-sm' 
                : 'border-transparent hover:bg-slate-50/60'
            ]"
            class="p-3 rounded-xl border flex gap-3 transition cursor-pointer">
            <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0" />
            <div v-else class="w-12 h-12 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 shrink-0 shadow-sm">
              <font-awesome :icon="['fas', 'briefcase']" />
            </div>
            <div class="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <h4 class="font-extrabold text-slate-800 text-[11px] truncate" :title="item.name">{{ item.name }}</h4>
                <p class="text-[10px] text-slate-500 font-medium truncate mt-0.5">{{ translateCategory(item.category) }}</p>
              </div>
              <div class="flex justify-between items-center mt-2 text-[9px] text-slate-400 font-mono">
                <span>ID: {{ getMockCode(item) }}</span>
                <span>{{ formatDateShort(item.date) }}</span>
              </div>
            </div>
          </div>
          <div v-if="filteredLostItems.length === 0" class="text-center py-20 text-slate-400">
            <font-awesome :icon="['fas', 'magnifying-glass']" class="text-lg mb-2" />
            <p class="text-xs font-bold">{{ $t('ไม่พบรายการของหาย') }}</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Found Items list (xl:col-span-4) -->
      <div class="xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[680px]">
        <div class="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <font-awesome :icon="['fas', 'box-open']" class="text-emerald-650" />
            {{ $t('2. เลือกของในคลังเปรียบเทียบ (Found Items)') }}
          </h3>
          <!-- Search box -->
          <div class="relative mt-3">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
              <font-awesome :icon="['fas', 'magnifying-glass']" />
            </span>
            <input v-model="foundSearchQuery" type="text" :placeholder="$t('ค้นหาของพบเจอ...')"
              class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-250 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs text-slate-700 transition" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          <!-- Guide state if no lost item selected -->
          <div v-if="!selectedLost" class="text-center py-32 px-6 text-slate-400">
            <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 border border-slate-150 mb-3 shadow-inner">
              <font-awesome :icon="['fas', 'arrow-left']" />
            </div>
            <h4 class="text-xs font-bold text-slate-600">{{ $t('กรุณาเลือกรายการของหายก่อน') }}</h4>
            <p class="text-[10px] mt-1">{{ $t('ระบบจะแสดงรายชื่อของพบที่อยู่ในหมวดหมู่เดียวกันขึ้นมาเปรียบเทียบแบบอัตโนมัติ') }}</p>
          </div>

          <div v-else-if="filteredFoundItems.length === 0" class="text-center py-32 px-6 text-slate-400">
            <font-awesome :icon="['fas', 'box-open']" class="text-lg mb-2" />
            <p class="text-xs font-bold">{{ $t('ไม่มีสิ่งของที่พบเจอในหมวดหมู่เดียวกัน') }}</p>
          </div>

          <div v-else v-for="item in filteredFoundItems" :key="item.id" 
            @click="selectFoundItem(item)"
            :class="[
              selectedFound && selectedFound.id === item.id 
                ? 'bg-emerald-50/80 border-emerald-250 shadow-sm' 
                : 'border-transparent hover:bg-slate-50/60'
            ]"
            class="p-3 rounded-xl border flex gap-3 transition cursor-pointer">
            <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0" />
            <div v-else class="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <font-awesome :icon="['fas', 'box-open']" />
            </div>
            <div class="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <h4 class="font-extrabold text-slate-800 text-[11px] truncate" :title="item.name">{{ item.name }}</h4>
                <p class="text-[10px] text-slate-500 font-medium truncate mt-0.5">{{ translateCategory(item.category) }}</p>
              </div>
              <div class="flex justify-between items-center mt-2 text-[9px] text-slate-400 font-mono">
                <span>ID: {{ getMockCode(item) }}</span>
                <span>{{ formatDateShort(item.date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center / Workspace Column: Comparison & AI matching (xl:col-span-4) -->
      <div class="xl:col-span-4 space-y-6">
        
        <!-- Comparison Desk Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 min-h-[300px] flex flex-col justify-between">
          <div class="border-b border-slate-100 pb-3 mb-4">
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <font-awesome :icon="['fas', 'shuffle']" class="text-indigo-600" />
              {{ $t('3. โต๊ะเปรียบเทียบข้อมูลคู่จับคู่') }}
            </h3>
          </div>

          <div class="space-y-4 flex-1">
            <!-- Selected Lost -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-550 border border-rose-100 text-xs shrink-0 shadow-inner">
                <font-awesome :icon="['fas', 'briefcase']" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[9px] font-bold text-rose-600 uppercase tracking-wide">{{ $t('ฝั่งแจ้งของหาย') }}</p>
                <h4 class="font-extrabold text-slate-800 text-[11px] truncate mt-0.5">
                  {{ selectedLost ? selectedLost.name : $t('ยังไม่เลือกรายการ') }}
                </h4>
              </div>
            </div>

            <!-- VS Divider -->
            <div class="text-center font-bold text-[10px] text-slate-400 flex items-center justify-center gap-4">
              <div class="h-[1px] bg-slate-150 flex-1"></div>
              <span>COMPARE</span>
              <div class="h-[1px] bg-slate-150 flex-1"></div>
            </div>

            <!-- Selected Found -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-650 border border-emerald-100 text-xs shrink-0 shadow-inner">
                <font-awesome :icon="['fas', 'box-open']" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">{{ $t('ฝั่งคลังสิ่งของพบเจอ') }}</p>
                <h4 class="font-extrabold text-slate-800 text-[11px] truncate mt-0.5">
                  {{ selectedFound ? selectedFound.name : $t('ยังไม่เลือกรายการ') }}
                </h4>
              </div>
            </div>
          </div>

          <!-- Trigger AI button -->
          <div class="mt-6">
            <button 
              @click="runAIPairMatching"
              :disabled="!selectedLost || !selectedFound || isAnalyzing"
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2"
            >
              <font-awesome :icon="['fas', isAnalyzing ? 'spinner' : 'robot']" :class="{ 'animate-spin': isAnalyzing }" />
              {{ isAnalyzing ? $t('กำลังวิเคราะห์ด้วย Gemini AI...') : $t('วิเคราะห์ความเข้ากันด้วย AI') }}
            </button>
          </div>
        </div>

        <!-- AI Match Result Card -->
        <div v-if="matchResult || isAnalyzing" class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center justify-center min-h-[250px] animate-fade-in">
          <!-- Scanning state -->
          <div v-if="isAnalyzing" class="text-center py-6 space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xl mx-auto shadow-sm animate-pulse">
              <font-awesome :icon="['fas', 'microchip']" class="animate-spin" />
            </div>
            <h4 class="text-xs font-bold text-slate-700">{{ $t('กำลังอ่านข้อมูลประมวลผล...') }}</h4>
            <p class="text-[10px] text-slate-400">{{ $t('Gemini AI กำลังวิเคราะห์ชื่อ ตำหนิ สถานที่และวันเวลาสูญหาย') }}</p>
          </div>

          <!-- Result state -->
          <div v-else-if="matchResult" class="w-full space-y-4">
            <div class="text-center">
              <!-- Confidence badge -->
              <div 
                :class="[
                  matchResult.confidence >= 75 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : matchResult.confidence >= 50 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                ]"
                class="w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center mx-auto shadow-sm"
              >
                <span class="text-2xl font-black font-mono leading-none">{{ matchResult.confidence }}%</span>
                <span class="text-[9px] font-bold mt-1 uppercase">match</span>
              </div>
              <h4 class="text-xs font-extrabold text-slate-800 mt-3">
                {{ matchResult.matched ? $t('มีโอกาสสูงที่จะเป็นของชิ้นเดียวกัน') : $t('ยังไม่ตรงกันเพียงพอ') }}
              </h4>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span class="text-[9px] font-bold text-slate-450 uppercase tracking-wider">{{ $t('ข้อวินิจฉัยจาก AI:') }}</span>
              <p class="text-[11px] text-slate-650 font-medium leading-relaxed mt-1">
                {{ matchResult.reason }}
              </p>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2 pt-2" v-if="matchResult.matched">
              <button 
                @click="processClaimSuccess"
                class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition duration-150 shadow-sm"
              >
                <font-awesome :icon="['fas', 'check']" class="mr-1.5" /> {{ $t('ทำเรื่องคืนของ') }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useItemsStore } from '~/stores/items'
import { useAuthStore } from '~/stores/auth'
import { useItemHelpers } from '~/composables/useItemHelpers'
import { useRuntimeConfig } from '#app'

definePageMeta({ layout: 'dashboard', title: 'วิเคราะห์จับคู่ (AI Matching)', icon: 'robot' })

const itemsStore = useItemsStore()
const authStore = useAuthStore()
const { translateCategory, getMockCode, getItemImageSrc, formatDateShort, changeStatus } = useItemHelpers()

const lostSearchQuery = ref('')
const foundSearchQuery = ref('')

const selectedLost = ref<any>(null)
const selectedFound = ref<any>(null)

const isAnalyzing = ref(false)
const matchResult = ref<any>(null)

// Initialize
onMounted(async () => {
  authStore.initAuth()
  if (itemsStore.items.length === 0) {
    await itemsStore.fetchItems()
  }
})

// Filter items
const activeLostItems = computed(() => {
  return itemsStore.items.filter(item => item.status === 'lost')
})

const activeFoundItems = computed(() => {
  return itemsStore.items.filter(item => item.status === 'found' || item.status === 'stored')
})

const filteredLostItems = computed(() => {
  let list = activeLostItems.value
  if (lostSearchQuery.value.trim() !== '') {
    const q = lostSearchQuery.value.toLowerCase().trim()
    list = list.filter(item => 
      item.name.toLowerCase().includes(q) || 
      (item.place && item.place.toLowerCase().includes(q)) ||
      String(item.id).includes(q) ||
      getMockCode(item).toLowerCase().includes(q)
    )
  }
  return list
})

const filteredFoundItems = computed(() => {
  let list = activeFoundItems.value
  // Filter by category to match selected lost item
  if (selectedLost.value) {
    list = list.filter(item => item.category_id === selectedLost.value.category_id)
  }
  if (foundSearchQuery.value.trim() !== '') {
    const q = foundSearchQuery.value.toLowerCase().trim()
    list = list.filter(item => 
      item.name.toLowerCase().includes(q) || 
      (item.place && item.place.toLowerCase().includes(q)) ||
      String(item.id).includes(q) ||
      getMockCode(item).toLowerCase().includes(q)
    )
  }
  return list
})

// Selection Actions
const selectLostItem = (item: any) => {
  selectedLost.value = item
  selectedFound.value = null // reset found selection
  matchResult.value = null   // reset match analysis
}

const selectFoundItem = (item: any) => {
  selectedFound.value = item
  matchResult.value = null   // reset match analysis
}

// Run AI pair matching
const runAIPairMatching = async () => {
  if (!selectedLost.value || !selectedFound.value) return

  isAnalyzing.value = true
  matchResult.value = null
  const config = useRuntimeConfig()


  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    const response = await axios.post(`${config.public.apiBaseUrl}/items/analyze-match`, {
      lost_item_id: selectedLost.value.dbId || selectedLost.value.id,
      item_id: selectedFound.value.dbId || selectedFound.value.id
    }, { headers })

    matchResult.value = response.data
  } catch (error) {
    console.error('Failed to run manual AI match comparison:', error)
    alert('เกิดข้อผิดพลาดในการเรียกใช้ระบบ AI ตรวจวิเคราะห์เปรียบเทียบข้อมูล')
  } finally {
    isAnalyzing.value = false
  }
}

// Mark Found Item as Claimed
const processClaimSuccess = async () => {
  if (!selectedFound.value) return
  if (!confirm(`คุณต้องการยืนยันการคืนของ "${selectedFound.value.name}" แก่เจ้าของและเปลี่ยนสถานะสิ่งของเป็นคืนสำเร็จใช่หรือไม่?`)) return

  try {
    // Update found item to claimed status
    await changeStatus(selectedFound.value.id, 'claimed')
    alert('บันทึกการคืนของเรียบร้อยแล้ว!')
    
    // Refresh items store data
    await itemsStore.fetchItems()

    // Reset workspace states
    selectedLost.value = null
    selectedFound.value = null
    matchResult.value = null
  } catch (error) {
    console.error('Failed to process return claim:', error)
    alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะสิ่งของ')
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
