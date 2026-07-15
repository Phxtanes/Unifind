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
          <input v-model="searchQuery" type="text" id="search-found"
            placeholder="ค้นหา (ชื่อ, สถานที่, ID)..." 
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs text-slate-700 transition" />
        </div>

        <!-- Category Dropdown Filter -->
        <div class="flex items-center gap-2">
          <label for="category-filter" class="text-[10px] font-bold text-slate-400 uppercase shrink-0">หมวดหมู่:</label>
          <select id="category-filter" v-model="selectedCategory" class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition">
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
          <select id="locker-filter" v-model="selectedLocker" class="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition">
            <option value="">ทั้งหมด</option>
            <option v-for="locker in uniqueLockers" :key="locker" :value="locker">
              {{ locker }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[10px] font-bold text-slate-455 uppercase tracking-wider">ประเภท:</span>
        <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-100 uppercase">พบของ (Found)</span>
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
                <img v-if="getItemImageSrc(item)" :src="getItemImageSrc(item)" class="w-16 h-16 rounded-xl object-cover border border-slate-155 shadow-sm" />
                <div v-else class="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-400 border border-emerald-100 shadow-sm">
                  <font-awesome :icon="['fas', 'puzzle-piece']" />
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 break-words max-w-[220px]" :title="item.name">{{ item.name }}</h4>
                  <p class="text-[9px] text-slate-400 font-mono mt-0.5">ID: {{ getMockCode(item) }}</p>
                </div>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium">{{ translateCategory(item.category) }}</td>
              <td class="py-3 px-6">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold rounded-full border uppercase bg-emerald-50/70 text-emerald-700 border-emerald-100/80">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  พร้อมคืน
                </span>
              </td>
              <td class="py-3 px-6 text-slate-600 font-medium break-words max-w-[200px]" :title="item.place">{{ item.place }}</td>
              <td class="py-3 px-6 text-slate-450 font-medium" :title="formatFullDate(item.date)">{{ formatDateShort(item.date) }}</td>
              <td class="py-3 px-6 text-slate-600 font-mono font-medium">{{ item.locker || '-' }}</td>
              <td class="py-3 px-6">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click.stop="openReturnModal(item)"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg transition duration-150 shadow-sm flex items-center gap-1.5 hover:shadow">
                    <font-awesome :icon="['fas', 'hand-holding-hand']" />
                    คืนของ
                  </button>
                  <button @click.stop="openEditModal(item)" class="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-transparent hover:border-indigo-100/50 transition" title="แก้ไข">
                    <font-awesome :icon="['fas', 'pen-to-square']" />
                  </button>
                  <button @click.stop="deleteItem(item.id)" class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100/50 transition">
                    <font-awesome :icon="['fas', 'trash-can']" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedItems.length === 0">
              <td colspan="7" class="text-center py-20 text-slate-455">
                <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg mx-auto shadow-sm">
                  <font-awesome :icon="['fas', 'puzzle-piece']" />
                </div>
                <p class="text-xs mt-3 font-semibold text-slate-700">ไม่มีรายการสิ่งของที่พบในระบบ</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-between items-center text-xs font-medium text-slate-500 pt-4 border-t border-slate-100">
        <span>แสดงหน้า <strong class="text-slate-800">{{ currentPage }}</strong> จากทั้งหมด <strong class="text-slate-800">{{ totalPages }}</strong> หน้า ({{ filteredItems.length }} รายการ)</span>
        <div class="flex items-center gap-1.5">
          <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
            class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-355 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">ก่อนหน้า</button>
          
          <template v-for="page in paginationRange" :key="page">
            <span v-if="page === '...'" class="px-2 py-1 text-slate-400">...</span>
            <button v-else @click="currentPage = Number(page)" 
              :class="currentPage === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50/50'"
              class="px-2.5 py-1 border rounded-lg transition shadow-sm font-semibold">
              {{ page }}
            </button>
          </template>

          <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-355 hover:bg-slate-50/50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">ถัดไป</button>
        </div>
      </div>
    </div>

    <!-- Item Detail Modal -->
    <ItemDetailModal 
      :show="showDetailModal" 
      :item="selectedItem" 
      @close="closeItemDetail" 
      @edit="(item) => { closeItemDetail(); openEditModal(item) }"
    />

    <!-- Edit Item Modal -->
    <CreateItemModal 
      :show="showEditModal" 
      :is-submitting="isSubmitting" 
      :edit-item="editingItem"
      @close="closeEditModal" 
      @submit="handleEditSubmit" 
    />

    <!-- Success Modal -->
    <SuccessModal 
      :show="showSuccessModal" 
      :title="successModalTitle" 
      :message="successModalMessage" 
      @close="showSuccessModal = false" 
    />

    <!-- Return Item Modal -->
    <div v-if="showReturnModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50  transition-opacity duration-300">
      <div class="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden max-h-[90vh] flex flex-col animate-fade-in">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 text-sm">
              <font-awesome :icon="['fas', 'hand-holding-hand']" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">ทำรายการส่งคืนสิ่งของ</h3>
              <p class="text-[10px] text-slate-450 mt-0.5">กรอกข้อมูลผู้รับสิ่งของเพื่อบันทึกประวัติการส่งคืน</p>
            </div>
          </div>
          <button @click="closeReturnModal" class="text-slate-400 hover:text-slate-650 transition p-1">
            <font-awesome :icon="['fas', 'xmark']" />
          </button>
        </div>

        <!-- Form content -->
        <form @submit.prevent="handleReturnSubmit" class="space-y-4 overflow-y-auto flex-1 pr-1">
          <div class="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex items-center gap-3">
            <img v-if="getItemImageSrc(returnItem)" :src="getItemImageSrc(returnItem)" class="w-12 h-12 rounded-lg object-cover border border-slate-200" />
            <div v-else class="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-400 text-lg">
              <font-awesome :icon="['fas', 'box-open']" />
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800 line-clamp-1">{{ returnItem?.name }}</p>
              <p class="text-[9px] text-slate-500 font-medium">ตู้ล็อกเกอร์: {{ returnItem?.locker || '-' }}</p>
            </div>
          </div>

          <!-- Receiver Full Name -->
          <div>
            <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">ชื่อ-นามสกุล ผู้รับคืน <span style="color: red;">*</span></label>
            <input type="text" v-model="returnForm.full_name" required placeholder="เช่น สมชาย รักดี" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <!-- Receiver Person Type -->
          <div>
            <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">ประเภทบุคคล <span style="color: red;">*</span></label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" @click="returnForm.person_type = 'STUDENT'" :class="returnForm.person_type === 'STUDENT' ? 'bg-indigo-600 text-white font-bold border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'" class="py-2 text-[10px] rounded-xl border text-center transition">นักศึกษา</button>
              <button type="button" @click="returnForm.person_type = 'STAFF'" :class="returnForm.person_type === 'STAFF' ? 'bg-indigo-600 text-white font-bold border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'" class="py-2 text-[10px] rounded-xl border text-center transition">บุคลากร</button>
            </div>
          </div>

          <!-- Student ID (if student) -->
          <div v-if="returnForm.person_type === 'STUDENT'">
            <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">รหัสนักศึกษา <span style="color: red;">*</span></label>
            <input type="text" v-model="returnForm.student_id" required placeholder="เช่น 660110xxxx" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <!-- Phone Number -->
          <div>
            <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">เบอร์โทรศัพท์ติดต่อ <span style="color: red;">*</span></label>
            <input type="text" v-model="returnForm.phone" required placeholder="เช่น 089xxxxxxx" maxlength="10" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">อีเมล (ถ้ามี)</label>
            <input type="email" v-model="returnForm.email" placeholder="เช่น somchai@utcc.ac.th" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <!-- Relationship -->
          <div>
            <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">ความสัมพันธ์กับสิ่งของ <span style="color: red;">*</span></label>
            <select v-model="returnForm.relationship" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition">
              <option value="owner">เป็นเจ้าของสิ่งของ (Owner)</option>
              <option value="representative">เป็นผู้แทนมารับคืน (Representative)</option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">หมายเหตุ / บันทึกการส่งมอบ</label>
            <textarea v-model="returnForm.remark" rows="2" placeholder="เช่น ตรวจสอบภาพถ่ายหรือหลักฐานเรียบร้อยแล้ว" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button type="button" @click="closeReturnModal" class="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-550 text-xs font-semibold py-2 px-4 rounded-xl transition">ยกเลิก</button>
            <button type="submit" :disabled="isSubmitting" class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2">
              <font-awesome v-if="isSubmitting" :icon="['fas', 'spinner']" class="animate-spin" />
              <span>ยืนยันการคืนของ</span>
            </button>
          </div>
        </form>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'

import ItemDetailModal from '~/components/ItemDetailModal.vue'
import CreateItemModal from '~/components/CreateItemModal.vue'

definePageMeta({ layout: 'dashboard', title: 'รายการพบของ', icon: 'box-open' })

const itemsStore = useItemsStore()
const { translateCategory, getMockCode, getItemImageSrc, formatDateShort, formatFullDate, changeStatus, deleteItem } = useItemHelpers()

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedLocker = ref('')
const currentPage = ref(1)
const limit = ref(8)

const uniqueLockers = computed(() => {
  const lockers = itemsStore.items
    .filter(item => item.status === 'found' || item.status === 'stored')
    .map(item => item.locker)
    .filter((l): l is string => typeof l === 'string' && l.trim() !== '')
  return [...new Set(lockers)].sort()
})

const showDetailModal = ref(false)
const selectedItem = ref<any>(null)

const showEditModal = ref(false)
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

const openEditModal = (item: any) => {
  editingItem.value = item
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  setTimeout(() => { editingItem.value = null }, 300)
}

const handleEditSubmit = async (data: any, imageFile: any) => {
  isSubmitting.value = true
  try {
    if (editingItem.value) {
      await itemsStore.updateFoundItem(editingItem.value.id, data.itemData, data.finderData, imageFile)
      showEditModal.value = false
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

const showReturnModal = ref(false)
const returnItem = ref<any>(null)
const returnForm = ref({
  full_name: '',
  person_type: 'STUDENT',
  student_id: '',
  phone: '',
  email: '',
  relationship: 'owner',
  remark: ''
})

const openReturnModal = (item: any) => {
  returnItem.value = item
  returnForm.value = {
    full_name: '',
    person_type: 'STUDENT',
    student_id: '',
    phone: '',
    email: '',
    relationship: 'owner',
    remark: ''
  }
  showReturnModal.value = true
}

const closeReturnModal = () => {
  showReturnModal.value = false
  setTimeout(() => { returnItem.value = null }, 300)
}

const handleReturnSubmit = async () => {
  if (!returnItem.value) return
  isSubmitting.value = true
  try {
    const remarkWithRel = `ความสัมพันธ์: ${returnForm.value.relationship === 'owner' ? 'เจ้าของ' : 'ผู้แทนรับคืน'}. หมายเหตุ: ${returnForm.value.remark || '-'}`
    
    await itemsStore.claimFoundItem(returnItem.value.id, {
      full_name: returnForm.value.full_name,
      person_type: returnForm.value.person_type,
      student_id: returnForm.value.student_id,
      phone: returnForm.value.phone,
      email: returnForm.value.email,
      remark: remarkWithRel
    })

    showReturnModal.value = false
    triggerSuccess('คืนของสำเร็จ!', `ดำเนินการส่งคืนสิ่งของ "${returnItem.value.name}" แก่คุณ ${returnForm.value.full_name} เรียบร้อยแล้ว!`)
  } catch (error) {
    console.error('Error claiming found item:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกการส่งคืนของ')
  } finally {
    isSubmitting.value = false
    returnItem.value = null
  }
}

watch([searchQuery, selectedCategory, selectedLocker], () => { currentPage.value = 1 })

const filteredItems = computed(() => {
  let result = itemsStore.items.filter(item => item.status === 'found' || item.status === 'stored')
  
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
