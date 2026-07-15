<template>
  <div class="space-y-6">

    <!-- Controls & Search Card -->
    <div class="bg-white rounded-xl py-3 px-4 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 flex-wrap">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-xs min-w-[200px]">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
            <font-awesome :icon="['fas', 'magnifying-glass']" />
          </span>
          <input v-model="searchQuery" type="text" id="search-items"
            :placeholder="$t('ค้นหาด้วยรหัสสิ่งของ หรือ ชื่อสิ่งของ...')" 
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs text-slate-700 transition" />
        </div>

        <!-- Category Dropdown Filter -->
        <div class="flex items-center gap-2">
          <label for="category-filter" class="text-[10px] font-bold text-slate-400 uppercase shrink-0">{{ $t('หมวดหมู่') }}:</label>
          <select id="category-filter" v-model="selectedCategory" class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition font-sans">
            <option value="">{{ $t('ทั้งหมด') }}</option>
            <option value="Electronics">{{ $t('อุปกรณ์อิเล็กทรอนิกส์') || 'Electronics' }}</option>
            <option value="Documents">{{ $t('เอกสารสำคัญ') || 'Documents' }}</option>
            <option value="Clothing">{{ $t('เสื้อผ้า / เครื่องแต่งกาย') || 'Clothing' }}</option>
            <option value="Accessories">{{ $t('เครื่องประดับ / ของใช้ส่วนตัว') || 'Accessories' }}</option>
            <option value="Other">{{ $t('อื่นๆ') || 'Other' }}</option>
          </select>
        </div>

        <!-- Status Dropdown Filter -->
        <div class="flex items-center gap-2">
          <label for="status-filter" class="text-[10px] font-bold text-slate-400 uppercase shrink-0">{{ $t('สถานะ') }}:</label>
          <select id="status-filter" v-model="selectedStatus" class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition font-sans">
            <option value="">{{ $t('ทั้งหมด') }}</option>
            <option value="lost">{{ $t('ตามหาเจ้าของ') }}</option>
            <option value="found">{{ $t('พร้อมคืน') }} (Found)</option>
            <option value="stored">{{ $t('พร้อมคืน') }} (Stored)</option>
            <option value="claimed">{{ $t('คืนสำเร็จ') }} (Claimed)</option>
            <option value="removed">{{ $t('นำออก') || 'Removed' }}</option>
          </select>
        </div>

        <!-- Locker Dropdown Filter -->
        <div class="flex items-center gap-2">
          <label for="locker-filter" class="text-[10px] font-bold text-slate-400 uppercase shrink-0">{{ $t('ตู้จัดเก็บ') }}:</label>
          <select id="locker-filter" v-model="selectedLocker" class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition font-sans">
            <option value="">{{ $t('ทั้งหมด') }}</option>
            <option v-for="locker in uniqueLockers" :key="locker" :value="locker">
              {{ locker }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[10px] font-bold text-slate-455 uppercase tracking-wider font-sans">{{ $t('ประเภท') }}:</span>
        <span class="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-100 uppercase font-sans">{{ $t('ทั้งหมด') }}</span>
      </div>
    </div>

    <!-- Items Table Card -->
    <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[480px]">
      <div class="overflow-x-auto -mx-6">
        <table class="w-full text-left border-collapse min-w-[700px] font-sans">
          <thead>
            <tr class="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50/70">
              <th class="py-4 px-6 font-bold">{{ $t('รายการ') }}</th>
              <th class="py-4 px-6 font-bold">{{ $t('หมวดหมู่') }}</th>
              <th class="py-4 px-6 font-bold">{{ $t('สถานะสิ่งของ') }}</th>
              <th class="py-4 px-6 font-bold">{{ $t('สถานที่') }}</th>
              <th class="py-4 px-6 font-bold">{{ $t('วันที่บันทึก') }}</th>
              <th class="py-4 px-6 font-bold">{{ $t('ตู้จัดเก็บ') }}</th>
              <th class="py-4 px-6 font-bold text-center">{{ $t('จัดการ') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in paginatedItems" :key="item.id" @click="openItemDetail(item)" class="hover:bg-indigo-50/30 text-xs transition duration-150 cursor-pointer">
              <td class="py-3 px-6 flex items-center gap-3">
                <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-16 h-16 rounded-xl object-cover border border-slate-155 shadow-sm" />
                <div v-else class="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150 font-bold shadow-sm">
                  <font-awesome :icon="['fas', 'image']" />
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 break-words max-w-[220px]" :title="item.name">{{ item.name }}</h4>
                  <p class="text-[9px] text-slate-400 font-mono mt-0.5">ID: {{ getMockCode(item) }}</p>
                </div>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium">{{ translateCategory(item.category) }}</td>
              <td class="py-3 px-6">
                <span :class="{
                  'bg-rose-50/70 text-rose-700 border-rose-100/80': item.status === 'lost',
                  'bg-emerald-50/70 text-emerald-700 border-emerald-100/80': item.status === 'found' || item.status === 'stored',
                  'bg-slate-155/50 text-slate-700 border-slate-200/80': item.status === 'claimed' || item.status === 'removed'
                }" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold rounded-full border uppercase">
                  <span :class="{
                    'bg-rose-500': item.status === 'lost',
                    'bg-emerald-500': item.status === 'found' || item.status === 'stored',
                    'bg-slate-500': item.status === 'claimed' || item.status === 'removed'
                  }" class="w-1.5 h-1.5 rounded-full"></span>
                  {{ item.status === 'lost' ? $t('ตามหาเจ้าของ') : (item.status === 'found' || item.status === 'stored') ? $t('พร้อมคืน') : $t('คืนสำเร็จ') }}
                </span>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium break-words max-w-[200px]" :title="item.place">{{ item.place }}</td>
              <td class="py-3 px-6 text-slate-450 font-medium" :title="formatFullDate(item.date)">{{ formatDateShort(item.date) }}</td>
              <td class="py-3 px-6 text-slate-600 font-mono font-medium">{{ item.locker || '-' }}</td>
              <td class="py-3 px-6">
                <div class="flex items-center justify-center gap-2">
                  <button @click.stop="openItemDetail(item)" class="text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 p-1.5 rounded-lg border border-transparent hover:border-indigo-100/50 transition" :title="$t('ดูรายละเอียด')">
                    <font-awesome :icon="['fas', 'eye']" />
                  </button>
                  <button @click.stop="deleteItem(item.id)" class="text-slate-400 hover:text-rose-650 p-1.5 rounded-lg border border-transparent hover:border-rose-100 hover:bg-rose-50 transition" :title="$t('ลบ')">
                    <font-awesome :icon="['fas', 'trash-can']" />
                  </button>
                </div>
              </td>
            </tr>
            
            <tr v-if="paginatedItems.length === 0">
              <td colspan="7" class="text-center py-20 text-slate-455">
                <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg mx-auto shadow-sm">
                  <font-awesome :icon="['fas', 'magnifying-glass']" />
                </div>
                <p class="text-xs mt-3 font-semibold text-slate-700">{{ $t('ไม่มีข้อมูล') }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-between items-center text-xs font-medium text-slate-500 pt-4 border-t border-slate-100 font-sans">
        <span>
          {{ langStore.locale === 'th' ? 'แสดงหน้า' : 'Showing page' }} <strong class="text-slate-800">{{ currentPage }}</strong> 
          {{ langStore.locale === 'th' ? 'จากทั้งหมด' : 'of' }} <strong class="text-slate-800">{{ totalPages }}</strong> 
          {{ langStore.locale === 'th' ? 'หน้า' : 'pages' }} ({{ langStore.locale === 'th' ? 'ทั้งหมด' : 'Total' }} {{ filteredItems.length }} {{ langStore.locale === 'th' ? 'รายการ' : 'items' }})
        </span>
        <div class="flex items-center gap-1.5">
          <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
            class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">
            {{ langStore.locale === 'th' ? 'ก่อนหน้า' : 'Previous' }}
          </button>
          
          <template v-for="page in paginationRange" :key="page">
            <span v-if="page === '...'" class="px-2 py-1 text-slate-400">...</span>
            <button v-else @click="currentPage = Number(page)" 
              :class="currentPage === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50/50'"
              class="px-2.5 py-1 border rounded-lg transition shadow-sm font-semibold">
              {{ page }}
            </button>
          </template>

          <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">
            {{ langStore.locale === 'th' ? 'ถัดไป' : 'Next' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Item Detail Modal Component -->
    <ItemDetailModal 
      :show="showDetailModal" 
      :item="selectedItem" 
      @close="closeItemDetail" 
      @edit="handleEditClick"
    />

    <!-- Edit Found Item Modal -->
    <CreateItemModal 
      :show="showEditFoundModal" 
      :is-submitting="isSubmitting" 
      :edit-item="editingItem"
      @close="closeEditFoundModal" 
      @submit="handleEditFoundSubmit" 
    />

    <!-- Edit Lost Item Modal -->
    <ReportLostItemModal 
      :show="showEditLostModal" 
      :is-submitting="isSubmitting" 
      :edit-item="editingItem"
      @close="closeEditLostModal" 
      @submit="handleEditLostSubmit" 
    />

    <!-- Success Modal -->
    <SuccessModal 
      :show="showSuccessModal" 
      :title="successModalTitle" 
      :message="successModalMessage" 
      @close="showSuccessModal = false" 
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'
import { useLangStore } from '~/stores/lang'
import ItemDetailModal from '~/components/ItemDetailModal.vue'
import CreateItemModal from '~/components/CreateItemModal.vue'
import ReportLostItemModal from '~/components/ReportLostItemModal.vue'
import SuccessModal from '~/components/SuccessModal.vue'

definePageMeta({ layout: 'dashboard', title: 'รายการทั้งหมด', icon: 'clipboard-list' })

const langStore = useLangStore()

const itemsStore = useItemsStore()
const { translateCategory, getMockCode, getItemImageSrc, formatDateShort, formatFullDate, changeStatus, deleteItem } = useItemHelpers()

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedLocker = ref('')
const currentPage = ref(1)
const limit = ref(8)

// Modals State
const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

const showEditFoundModal = ref(false)
const showEditLostModal = ref(false)
const editingItem = ref<any>(null)
const isSubmitting = ref(false)

const showSuccessModal = ref(false)
const successModalTitle = ref('บันทึกสำเร็จ!')
const successModalMessage = ref('')

const triggerSuccess = (title: string, message: string) => {
  successModalTitle.value = title
  successModalMessage.value = message
  showSuccessModal.value = true
}

const openItemDetail = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const closeItemDetail = () => {
  showDetailModal.value = false
  setTimeout(() => { selectedItem.value = null }, 300)
}

const handleEditClick = (item: any) => {
  closeItemDetail()
  editingItem.value = item
  if (item.type === 'lost' || item.status === 'lost') {
    showEditLostModal.value = true
  } else {
    showEditFoundModal.value = true
  }
}

const closeEditFoundModal = () => {
  showEditFoundModal.value = false
  setTimeout(() => { editingItem.value = null }, 300)
}

const closeEditLostModal = () => {
  showEditLostModal.value = false
  setTimeout(() => { editingItem.value = null }, 300)
}

const handleEditFoundSubmit = async (data: any, imageFile: any) => {
  isSubmitting.value = true
  try {
    if (editingItem.value) {
      await itemsStore.updateFoundItem(editingItem.value.id, data.itemData, data.finderData, imageFile)
      showEditFoundModal.value = false
      triggerSuccess('แก้ไขข้อมูลสำเร็จ!', 'บันทึกการแก้ไขข้อมูลสิ่งของพบเจอเรียบร้อยแล้ว!')
    }
  } catch (error) {
    console.error('Error updating found item:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกการแก้ไข')
  } finally {
    isSubmitting.value = false
    editingItem.value = null
  }
}

const handleEditLostSubmit = async (data: any, imageFile: any) => {
  isSubmitting.value = true
  try {
    if (editingItem.value) {
      await itemsStore.updateLostItem(editingItem.value.id, data.itemData, data.reporterData, imageFile)
      showEditLostModal.value = false
      triggerSuccess('แก้ไขข้อมูลสำเร็จ!', 'บันทึกการแก้ไขข้อมูลของหายเรียบร้อยแล้ว!')
    }
  } catch (error) {
    console.error('Error updating lost item:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกการแก้ไข')
  } finally {
    isSubmitting.value = false
    editingItem.value = null
  }
}

const uniqueLockers = computed(() => {
  const lockers = itemsStore.items
    .map(item => item.locker)
    .filter((l): l is string => typeof l === 'string' && l.trim() !== '')
  return [...new Set(lockers)].sort()
})

watch([searchQuery, selectedCategory, selectedStatus, selectedLocker], () => { currentPage.value = 1 })

const filteredItems = computed(() => {
  let result = itemsStore.items

  if (selectedCategory.value) {
    result = result.filter(item => item.category === selectedCategory.value)
  }

  if (selectedStatus.value) {
    result = result.filter(item => item.status === selectedStatus.value)
  }

  if (selectedLocker.value) {
    result = result.filter(item => item.locker === selectedLocker.value)
  }

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.place && item.place.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.locker && item.locker.toLowerCase().includes(q)) ||
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

const paginationRange = computed(() => {
  const range: (number | string)[] = []
  const maxVisiblePages = 5
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      range.push(i)
    }
  } else {
    const start = Math.max(2, currentPage.value - 1)
    const end = Math.min(totalPages.value - 1, currentPage.value + 1)
    
    range.push(1)
    if (start > 2) {
      range.push('...')
    }
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    if (end < totalPages.value - 1) {
      range.push('...')
    }
    range.push(totalPages.value)
  }
  return range
})
</script>
