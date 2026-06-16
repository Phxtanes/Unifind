<template>
  <div class="space-y-6">

    <!-- Controls & Search Card -->
    <div class="bg-white rounded-xl py-3 px-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="relative flex-1 max-w-xs">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">🔎</span>
        <input v-model="searchQuery" type="text" id="search-items"
          placeholder="ค้นหา..." 
          class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs text-slate-700 transition" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold text-slate-450 uppercase tracking-wider">หมวดหมู่ปัจจุบัน:</span>
        <span class="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-100 uppercase">ทั้งหมด</span>
      </div>
    </div>

    <!-- Items Table Card -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[480px]">
      <div class="overflow-x-auto -mx-6">
        <table class="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr class="border-b border-slate-150 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/75">
              <th class="py-3.5 px-6 font-bold">รายการ</th>
              <th class="py-3.5 px-6 font-bold">หมวดหมู่</th>
              <th class="py-3.5 px-6 font-bold">สถานะสิ่งของ</th>
              <th class="py-3.5 px-6 font-bold">สถานที่</th>
              <th class="py-3.5 px-6 font-bold">วันที่บันทึก</th>
              <th class="py-3.5 px-6 font-bold">ตู้ล็อกเกอร์</th>
              <th class="py-3.5 px-6 font-bold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in paginatedItems" :key="item.id" class="hover:bg-slate-50/50 text-xs transition duration-150">
              <td class="py-3 px-6 flex items-center gap-3">
                <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-10 h-10 rounded-xl object-cover border border-slate-150 shadow-sm" />
                <div v-else class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150 font-bold shadow-sm">📷</div>
                <div>
                  <h4 class="font-bold text-slate-800 truncate max-w-[180px]" :title="item.name">{{ item.name }}</h4>
                  <p class="text-[9px] text-slate-400 font-mono mt-0.5">ID: {{ getMockCode(item) }}</p>
                </div>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium">{{ translateCategory(item.category) }}</td>
              <td class="py-3 px-6">
                <span :class="{
                  'bg-rose-50/70 text-rose-700 border-rose-100/80': item.status === 'lost',
                  'bg-emerald-50/70 text-emerald-700 border-emerald-100/80': item.status === 'found' || item.status === 'stored',
                  'bg-slate-150/50 text-slate-700 border-slate-200/80': item.status === 'claimed' || item.status === 'removed'
                }" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold rounded-full border uppercase">
                  <span :class="{
                    'bg-rose-500': item.status === 'lost',
                    'bg-emerald-500': item.status === 'found' || item.status === 'stored',
                    'bg-slate-500': item.status === 'claimed' || item.status === 'removed'
                  }" class="w-1.5 h-1.5 rounded-full"></span>
                  {{ item.status === 'lost' ? 'ตามหาเจ้าของ' : (item.status === 'found' || item.status === 'stored') ? 'พร้อมคืน' : 'คืนสำเร็จ' }}
                </span>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium truncate max-w-[140px]" :title="item.place">{{ item.place }}</td>
              <td class="py-3 px-6 text-slate-450 font-medium" :title="formatFullDate(item.date)">{{ formatDateShort(item.date) }}</td>
              <td class="py-3 px-6 text-slate-600 font-mono font-medium">{{ item.locker || '-' }}</td>
              <td class="py-3 px-6">
                <div class="flex items-center justify-center gap-2">
                  <select :value="item.status === 'stored' ? 'found' : item.status === 'removed' ? 'claimed' : item.status" 
                    @change="changeStatus(item.id, ($event.target as HTMLSelectElement).value)" 
                    class="bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-semibold text-slate-600 py-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer shadow-sm">
                    <option value="lost">ของหาย (Lost)</option>
                    <option value="found">พบเจอ (Found)</option>
                    <option value="claimed">คืนแล้ว (Claimed)</option>
                  </select>
                  <button @click="deleteItem(item.id)" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-transparent hover:border-rose-100 hover:bg-rose-50 transition">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            
            <tr v-if="paginatedItems.length === 0">
              <td colspan="7" class="text-center py-20 text-slate-450">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg mx-auto shadow-sm">🔎</div>
                <p class="text-xs mt-3 font-semibold text-slate-700">ไม่พบรายการข้อมูลบันทึกสิ่งของในระบบ</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-between items-center text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
        <span>แสดงหน้า <strong class="text-slate-800">{{ currentPage }}</strong> จากทั้งหมด <strong class="text-slate-800">{{ totalPages }}</strong> หน้า (ทั้งหมด {{ filteredItems.length }} รายการ)</span>
        <div class="flex gap-2">
          <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
            class="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">ก่อนหน้า</button>
          <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">ถัดไป</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'

definePageMeta({ layout: 'dashboard', title: 'รายการทั้งหมด', icon: 'clipboard-list' })

const itemsStore = useItemsStore()
const { translateCategory, getMockCode, getItemImageSrc, formatDateShort, formatFullDate, changeStatus, deleteItem } = useItemHelpers()

const searchQuery = ref('')
const currentPage = ref(1)
const limit = ref(8)

watch(searchQuery, () => { currentPage.value = 1 })

const filteredItems = computed(() => {
  if (searchQuery.value.trim() === '') return itemsStore.items
  const q = searchQuery.value.toLowerCase().trim()
  return itemsStore.items.filter(item =>
    item.name.toLowerCase().includes(q) ||
    (item.description && item.description.toLowerCase().includes(q)) ||
    (item.place && item.place.toLowerCase().includes(q)) ||
    (item.category && item.category.toLowerCase().includes(q)) ||
    (item.locker && item.locker.toLowerCase().includes(q))
  )
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / limit.value) || 1)
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * limit.value
  return filteredItems.value.slice(start, start + limit.value)
})
</script>
