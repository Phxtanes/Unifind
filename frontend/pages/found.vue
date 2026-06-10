<template>
  <div class="space-y-6">

    <div>
      <h2 class="text-lg font-bold text-slate-900">🧩 รายการพบของ</h2>
      <p class="text-xs text-slate-400 mt-0.5">สิ่งของที่พบและนำส่งเข้าคลังพร้อมคืนเจ้าของ</p>
    </div>

    <!-- Controls & Search Card -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">🔎</span>
        <input v-model="searchQuery" type="text" id="search-found"
          placeholder="ค้นหาชื่อสิ่งของ, สถานที่ หรือรายละเอียด..." 
          class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-700 transition" />
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่:</span>
        <span class="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-100 uppercase">พบของ (Found)</span>
      </div>
    </div>

    <!-- Items Table Card -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[480px]">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-100 text-[10px] font-extrabold text-slate-450 uppercase tracking-wider bg-slate-50/50">
              <th class="py-3 px-4">รายการ</th>
              <th class="py-3 px-4">หมวดหมู่</th>
              <th class="py-3 px-4">สถานะ</th>
              <th class="py-3 px-4">สถานที่</th>
              <th class="py-3 px-4">วันที่บันทึก</th>
              <th class="py-3 px-4">ตู้ล็อกเกอร์</th>
              <th class="py-3 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="item in paginatedItems" :key="item.id" 
                @click="openItemDetail(item)"
                class="hover:bg-slate-50/80 text-xs transition duration-150 cursor-pointer">
              <td class="py-3 px-4 flex items-center gap-3">
                <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                <div v-else class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-400 border border-emerald-100">🧩</div>
                <div>
                  <h4 class="font-bold text-slate-800 truncate max-w-[180px]" :title="item.name">{{ item.name }}</h4>
                  <p class="text-[9px] text-slate-400 font-medium">ID: {{ getMockCode(item) }}</p>
                </div>
              </td>
              <td class="py-3 px-4 text-slate-600 font-medium">{{ translateCategory(item.category) }}</td>
              <td class="py-3 px-4">
                <span class="px-2.5 py-0.5 text-[9px] font-bold rounded border uppercase bg-emerald-50 text-emerald-700 border-emerald-100">พร้อมคืน</span>
              </td>
              <td class="py-3 px-4 text-slate-600 font-medium truncate max-w-[140px]" :title="item.place">{{ item.place }}</td>
              <td class="py-3 px-4 text-slate-450 font-medium" :title="formatFullDate(item.date)">{{ formatDateShort(item.date) }}</td>
              <td class="py-3 px-4 text-slate-600 font-mono font-medium">{{ item.locker || '-' }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-center gap-2">
                  <select :value="'found'"
                    @click.stop
                    @change.stop="changeStatus(item.id, ($event.target as HTMLSelectElement).value)" 
                    class="bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 py-1 px-1.5 rounded-lg outline-none focus:border-slate-800 transition">
                    <option value="lost">ของหาย (Lost)</option>
                    <option value="found">พบเจอ (Found)</option>
                    <option value="claimed">คืนแล้ว (Claimed)</option>
                  </select>
                  <button @click.stop="deleteItem(item.id)" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50 transition">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedItems.length === 0">
              <td colspan="7" class="text-center py-20 text-slate-450">
                <p class="text-lg">🧩</p>
                <p class="text-xs mt-2 font-medium">ไม่มีรายการสิ่งของที่พบในระบบ</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="mt-4 flex justify-between items-center text-xs font-medium text-slate-500 pt-3 border-t border-slate-50">
        <span>แสดงหน้า {{ currentPage }} จากทั้งหมด {{ totalPages }} หน้า ({{ filteredItems.length }} รายการ)</span>
        <div class="flex gap-2">
          <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
            class="px-3 py-2 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg disabled:opacity-40 transition">ก่อนหน้า</button>
          <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-3 py-2 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg disabled:opacity-40 transition">ถัดไป</button>
        </div>
      </div>
    </div>

    <!-- Item Detail Modal -->
    <ItemDetailModal 
      :show="showDetailModal" 
      :item="selectedItem" 
      @close="closeItemDetail" 
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'

import ItemDetailModal from '~/components/ItemDetailModal.vue'

definePageMeta({ layout: 'dashboard' })

const itemsStore = useItemsStore()
const { translateCategory, getMockCode, getItemImageSrc, formatDateShort, formatFullDate, changeStatus, deleteItem } = useItemHelpers()

const searchQuery = ref('')
const currentPage = ref(1)
const limit = ref(8)

const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

const openItemDetail = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const closeItemDetail = () => {
  showDetailModal.value = false
  setTimeout(() => { selectedItem.value = null }, 300)
}

watch(searchQuery, () => { currentPage.value = 1 })

const filteredItems = computed(() => {
  let result = itemsStore.items.filter(item => item.status === 'found' || item.status === 'stored')
  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.place && item.place.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    )
  }
  return result
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / limit.value) || 1)
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * limit.value
  return filteredItems.value.slice(start, start + limit.value)
})
</script>
