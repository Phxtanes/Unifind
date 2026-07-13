<template>
  <div class="space-y-6">

    <!-- Controls & Search Card -->
    <div class="bg-white rounded-xl py-3 px-4 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
            <font-awesome :icon="['fas', 'magnifying-glass']" />
          </span>
          <input v-model="searchQuery" type="text" id="search-claimed"
            placeholder="ค้นหา (ชื่อ, สถานที่, ID)..." 
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs text-slate-700 transition" />
        </div>

        <!-- Category Dropdown Filter -->
        <div class="flex items-center gap-2">
          <label for="category-filter" class="text-[10px] font-bold text-slate-400 uppercase shrink-0">หมวดหมู่:</label>
          <select id="category-filter" v-model="selectedCategory" class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition">
            <option value="">ทั้งหมด</option>
            <option value="Electronics">อุปกรณ์อิเล็กทรอนิกส์</option>
            <option value="Documents">เอกสารสำคัญ</option>
            <option value="Clothing">เสื้อผ้า / เครื่องแต่งกาย</option>
            <option value="Accessories">เครื่องประดับ / ของใช้ส่วนตัว</option>
            <option value="Other">อื่นๆ</option>
          </select>
        </div>

        <!-- Locker Dropdown Filter -->
        <div class="flex items-center gap-2">
          <label for="locker-filter" class="text-[10px] font-bold text-slate-400 uppercase shrink-0">ตู้ล็อกเกอร์:</label>
          <select id="locker-filter" v-model="selectedLocker" class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition">
            <option value="">ทั้งหมด</option>
            <option v-for="locker in uniqueLockers" :key="locker" :value="locker">
              {{ locker }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[10px] font-bold text-slate-455 uppercase tracking-wider">ประเภท:</span>
        <span class="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-100 uppercase">คืนแล้ว (Claimed)</span>
      </div>
    </div>

    <!-- Items Table Card -->
    <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[480px]">
      <div class="overflow-x-auto -mx-6">
        <table class="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr class="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50/70">
              <th class="py-4 px-6 font-bold">รายการ</th>
              <th class="py-4 px-6 font-bold">หมวดหมู่</th>
              <th class="py-4 px-6 font-bold">สถานะ</th>
              <th class="py-4 px-6 font-bold">สถานที่</th>
              <th class="py-4 px-6 font-bold">วันที่บันทึก</th>
              <th class="py-4 px-6 font-bold">ตู้ล็อกเกอร์</th>
              <th class="py-4 px-6 font-bold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in paginatedItems" :key="item.id" 
                @click="openItemDetail(item)"
                class="hover:bg-indigo-50/30 text-xs transition duration-150 cursor-pointer">
              <td class="py-3 px-6 flex items-center gap-3">
                <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-12 h-12 rounded-xl object-cover border border-slate-155 shadow-sm" />
                <div v-else class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150 shadow-sm">
                  <font-awesome :icon="['fas', 'clock-rotate-left']" />
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 truncate max-w-[180px]" :title="item.name">{{ item.name }}</h4>
                  <p class="text-[9px] text-slate-400 font-mono mt-0.5">ID: {{ getMockCode(item) }}</p>
                </div>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium">{{ translateCategory(item.category) }}</td>
              <td class="py-3 px-6">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold rounded-full border uppercase bg-slate-150/50 text-slate-700 border-slate-200/80">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  คืนสำเร็จ
                </span>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium truncate max-w-[140px]" :title="item.place">{{ item.place }}</td>
              <td class="py-3 px-6 text-slate-450 font-medium" :title="formatFullDate(item.date)">{{ formatDateShort(item.date) }}</td>
              <td class="py-3 px-6 text-slate-600 font-mono font-medium">{{ item.locker || '-' }}</td>
              <td class="py-3 px-6">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click.stop="handleRevertToFound(item)"
                    class="bg-amber-50 hover:bg-amber-100 text-amber-750 text-[11px] font-semibold py-1.5 px-3 rounded-lg transition duration-150 border border-amber-250/30 flex items-center gap-1.5 shadow-sm">
                    <font-awesome :icon="['fas', 'clock-rotate-left']" class="text-[10px]" />
                    นำกลับไปยังคลัง
                  </button>
                  <button @click.stop="deleteItem(item.id)" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100/50 transition">
                    <font-awesome :icon="['fas', 'trash-can']" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedItems.length === 0">
              <td colspan="7" class="text-center py-20 text-slate-455">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg mx-auto shadow-sm">
                  <font-awesome :icon="['fas', 'clock-rotate-left']" />
                </div>
                <p class="text-xs mt-3 font-semibold text-slate-700">ยังไม่มีรายการที่คืนเจ้าของ</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-between items-center text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
        <span>แสดงหน้า <strong class="text-slate-800">{{ currentPage }}</strong> จากทั้งหมด <strong class="text-slate-800">{{ totalPages }}</strong> หน้า ({{ filteredItems.length }} รายการ)</span>
        <div class="flex gap-2">
          <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
            class="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-355 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">ก่อนหน้า</button>
          <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-355 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">ถัดไป</button>
        </div>
      </div>
    </div>

    <!-- Revert to Warehouse Modal -->
    <div v-if="showRevertModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50  transition-opacity duration-300">
      <div class="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden max-h-[90vh] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-650 text-sm">
              <font-awesome :icon="['fas', 'clock-rotate-left']" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">นำสิ่งของกลับไปยังคลัง</h3>
              <p class="text-[10px] text-slate-450 mt-0.5">กรอกเหตุผลเพื่อบันทึกประวัติการนำสิ่งของกลับเข้าคลัง</p>
            </div>
          </div>
          <button @click="closeRevertModal" class="text-slate-400 hover:text-slate-650 transition p-1">
            <font-awesome :icon="['fas', 'xmark']" />
          </button>
        </div>

        <!-- Form Content -->
        <form @submit.prevent="submitRevert">
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">เหตุผลในการนำกลับ <span class="text-red-500">*</span></label>
              <textarea v-model="revertReason" required rows="3" placeholder="ระบุเหตุผล เช่น ลูกค้าแจ้งยกเลิกการรับของ, ข้อมูลบันทึกผิดพลาด..."
                class="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-100 transition resize-none"></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
            <button type="button" @click="closeRevertModal"
              class="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 text-[11px] transition">
              ยกเลิก
            </button>
            <button type="submit"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-[11px] transition flex items-center gap-1.5 shadow-md shadow-amber-500/10">
              <font-awesome :icon="['fas', 'check']" class="text-[10px]" />
              ยืนยันนำกลับคลัง
            </button>
          </div>
        </form>
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

definePageMeta({ layout: 'dashboard', title: 'รายการคืนแล้ว', icon: 'rotate' })

const itemsStore = useItemsStore()
const { translateCategory, getMockCode, getItemImageSrc, formatDateShort, formatFullDate, changeStatus, deleteItem } = useItemHelpers()

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedLocker = ref('')
const currentPage = ref(1)
const limit = ref(8)

const uniqueLockers = computed(() => {
  const lockers = itemsStore.items
    .filter(item => item.status === 'claimed' || item.status === 'removed')
    .map(item => item.locker)
    .filter((l): l is string => typeof l === 'string' && l.trim() !== '')
  return [...new Set(lockers)].sort()
})

// Item Detail Modal state
const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

const openItemDetail = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const closeItemDetail = () => {
  selectedItem.value = null
  showDetailModal.value = false
}

watch([searchQuery, selectedCategory, selectedLocker], () => { currentPage.value = 1 })

const showRevertModal = ref(false)
const revertItem = ref<any>(null)
const revertReason = ref('')

const handleRevertToFound = (item: any) => {
  revertItem.value = item
  revertReason.value = ''
  showRevertModal.value = true
}

const closeRevertModal = () => {
  showRevertModal.value = false
  revertItem.value = null
  revertReason.value = ''
}

const submitRevert = async () => {
  if (!revertItem.value) return
  const trimmedReason = revertReason.value.trim()
  if (!trimmedReason) {
    alert('กรุณากรอกเหตุผลเพื่อบันทึกประวัติการนำกลับคลัง')
    return
  }
  await changeStatus(revertItem.value.id, 'found', trimmedReason)
  closeRevertModal()
}


const filteredItems = computed(() => {
  let result = itemsStore.items.filter(item => item.status === 'claimed' || item.status === 'removed')
  
  if (selectedCategory.value) {
    result = result.filter(item => item.category === selectedCategory.value)
  }
  
  if (selectedLocker.value) {
    result = result.filter(item => item.locker === selectedLocker.value)
  }

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.place && item.place.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      String(item.id).includes(q) ||
      getMockCode(item).toLowerCase().includes(q)
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
