<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <span class="text-2xl mr-2">🔍</span>
            <span class="font-extrabold text-slate-800 text-lg tracking-tight">UTCC Lost & Found <span class="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md ml-1 border border-indigo-100">Staff Panel</span></span>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-slate-800">{{ authStore.user?.username || 'เจ้าหน้าที่' }}</p>
              <p class="text-xs text-indigo-600 font-medium">สำนักกิจการนักศึกษา</p>
            </div>
            <button @click="handleLogout" 
              class="bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold py-2 px-4 rounded-xl transition duration-150 border border-rose-100">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      <!-- Stats Board -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <!-- Card 1 -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">รายการทั้งหมด</p>
            <p class="text-2xl font-black text-slate-800">{{ items.length }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl">📦</div>
        </div>
        <!-- Card 2 -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-rose-500 text-xs font-bold uppercase tracking-wider mb-1">ของหาย (Lost)</p>
            <p class="text-2xl font-black text-rose-600">{{ countStatus('lost') }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">❌</div>
        </div>
        <!-- Card 3 -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">พบของเจอ (Found)</p>
            <p class="text-2xl font-black text-emerald-600">{{ countStatus('found') }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">✅</div>
        </div>
        <!-- Card 4 -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-indigo-500 text-xs font-bold uppercase tracking-wider mb-1">คืนเจ้าของแล้ว (Claimed)</p>
            <p class="text-2xl font-black text-indigo-600">{{ countStatus('claimed') }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">🎉</div>
        </div>
      </div>

      <!-- Controls & Search -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อสิ่งของ, สถานที่ หรือรายละเอียด..." 
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 transition" />
        </div>
        <!-- Filter Tabs / Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <button @click="statusFilter = 'all'" :class="{'bg-indigo-600 text-white': statusFilter === 'all', 'bg-slate-100 text-slate-600 hover:bg-slate-200': statusFilter !== 'all'}" 
            class="px-4 py-2 text-sm font-semibold rounded-xl transition duration-150">
            ทั้งหมด
          </button>
          <button @click="statusFilter = 'lost'" :class="{'bg-rose-500 text-white': statusFilter === 'lost', 'bg-slate-100 text-slate-600 hover:bg-slate-200': statusFilter !== 'lost'}" 
            class="px-4 py-2 text-sm font-semibold rounded-xl transition duration-150">
            ของหาย
          </button>
          <button @click="statusFilter = 'found'" :class="{'bg-emerald-500 text-white': statusFilter === 'found', 'bg-slate-100 text-slate-600 hover:bg-slate-200': statusFilter !== 'found'}" 
            class="px-4 py-2 text-sm font-semibold rounded-xl transition duration-150">
            พบของเจอ
          </button>
          <button @click="statusFilter = 'claimed'" :class="{'bg-slate-600 text-white': statusFilter === 'claimed', 'bg-slate-100 text-slate-600 hover:bg-slate-200': statusFilter !== 'claimed'}" 
            class="px-4 py-2 text-sm font-semibold rounded-xl transition duration-150">
            คืนแล้ว
          </button>
          
          <button @click="openCreateModal" 
            class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition duration-150 shadow-sm ml-auto md:ml-4">
            + บันทึกของใหม่
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredItems.length === 0" class="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4 text-2xl">🔎</div>
        <h2 class="text-xl font-bold text-slate-800 mb-2">ไม่พบข้อมูล</h2>
        <p class="text-slate-500 max-w-sm mx-auto">
          ไม่พบรายการข้อมูลบันทึกตามเงื่อนไขการค้นหาหรือคัดกรองในขณะนี้
        </p>
      </div>

      <!-- Grid of Items -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="item in filteredItems" :key="item.id" 
          class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition duration-200">
          
          <div>
            <!-- Image Area -->
            <div class="relative h-44 w-full bg-slate-100">
              <img v-if="item.image_url" :src="`http://localhost:9001${item.image_url}`" class="w-full h-full object-cover" />
              <div v-else class="flex items-center justify-center h-full text-slate-300 text-sm font-medium bg-slate-100">
                ❌ ไม่มีภาพประกอบ
              </div>
              <!-- Status Tag -->
              <div class="absolute top-3 right-3">
                <span :class="{
                  'bg-rose-500 text-white': item.status === 'lost',
                  'bg-emerald-500 text-white': item.status === 'found',
                  'bg-slate-500 text-white': item.status === 'claimed'
                }" class="px-2.5 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider">
                  {{ item.status === 'lost' ? 'ของหาย' : item.status === 'found' ? 'พบเจอ' : 'คืนแล้ว' }}
                </span>
              </div>
            </div>

            <!-- Details -->
            <div class="p-5">
              <h3 class="text-lg font-bold text-slate-800 truncate mb-1">{{ item.name }}</h3>
              <p class="text-slate-500 text-xs font-semibold mb-3">🕒 บันทึกเมื่อ {{ formatDate(item.date) }}</p>
              <p class="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{{ item.description || 'ไม่มีรายละเอียดเพิ่มเติม' }}</p>
              
              <div class="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                <div class="flex items-center">
                  <span class="mr-2">📍</span> <span class="font-medium text-slate-700 truncate">สถานที่: {{ item.place }}</span>
                </div>
                <div class="flex items-center">
                  <span class="mr-2">📁</span> <span class="text-slate-500">หมวดหมู่: <span class="font-semibold text-slate-700">{{ item.category }}</span></span>
                </div>
                <div class="flex items-center" v-if="item.locker">
                  <span class="mr-2">📦</span> <span class="text-slate-500">ตู้ล็อกเกอร์: <span class="font-semibold text-slate-700">{{ item.locker }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="p-5 pt-0 border-t border-slate-100 mt-4 flex items-center gap-2">
            <!-- Dropdown to Change Status -->
            <select :value="item.status" @change="changeStatus(item.id, $event.target.value)" 
              class="flex-1 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-2 px-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition">
              <option value="lost">🔴 ของหาย (Lost)</option>
              <option value="found">🟢 พบของเจอ (Found)</option>
              <option value="claimed">⚫ คืนแล้ว (Claimed)</option>
            </select>

            <!-- Delete button -->
            <button @click="deleteItem(item.id)" 
              class="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2 rounded-xl border border-rose-100 transition" title="ลบข้อมูล">
              🗑️
            </button>
          </div>

        </div>
      </div>

    </main>

    <!-- Create Item Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden max-w-xl w-full">
        <!-- Header -->
        <div class="bg-indigo-600 px-8 py-5 flex justify-between items-center text-white">
          <div>
            <h2 class="text-xl font-bold">แจ้งบันทึกข้อมูลของหาย / พบของ</h2>
            <p class="text-indigo-100 text-xs mt-0.5">กรุณากรอกรายละเอียดให้ครบถ้วนเพื่อจัดเก็บเข้าฐานข้อมูลของมหาวิทยาลัย</p>
          </div>
          <button @click="closeCreateModal" class="text-white hover:text-indigo-200 text-2xl font-semibold outline-none">&times;</button>
        </div>
        
        <!-- Form -->
        <form @submit.prevent="submitCreateForm" class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <!-- Status Selection -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">ประเภทการแจ้ง</label>
            <div class="grid grid-cols-2 gap-4">
              <label :class="{'ring-2 ring-indigo-600 bg-indigo-50 border-indigo-200': createForm.status === 'stored', 'bg-slate-50 border-slate-200': createForm.status !== 'stored'}" 
                class="cursor-pointer border rounded-xl p-3 flex items-center justify-center transition-all">
                <input type="radio" v-model="createForm.status" value="stored" class="sr-only">
                <span class="font-medium text-sm" :class="{'text-indigo-700': createForm.status === 'stored', 'text-slate-600': createForm.status !== 'stored'}">
                  🔴 ของหาย (Lost)
                </span>
              </label>
              <label :class="{'ring-2 ring-emerald-600 bg-emerald-50 border-emerald-200': createForm.status === 'removed', 'bg-slate-50 border-slate-200': createForm.status !== 'removed'}" 
                class="cursor-pointer border rounded-xl p-3 flex items-center justify-center transition-all">
                <input type="radio" v-model="createForm.status" value="removed" class="sr-only">
                <span class="font-medium text-sm" :class="{'text-emerald-700': createForm.status === 'removed', 'text-slate-600': createForm.status !== 'removed'}">
                  🟢 คืนเจ้าของแล้ว (Claimed)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">ชื่อสิ่งของ <span class="text-red-500">*</span></label>
            <input v-model="createForm.name" type="text" required placeholder="เช่น กระเป๋าสตางค์หนังสีน้ำตาล, iPad Pro" 
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
          </div>

          <!-- Category and Locker -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">หมวดหมู่ <span class="text-red-500">*</span></label>
              <input v-model="createForm.category" type="text" required placeholder="เช่น อุปกรณ์อิเล็กทรอนิกส์, เงินสด" 
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">ตำแหน่งเก็บ/ตู้ล็อกเกอร์</label>
              <input v-model="createForm.locker" type="text" placeholder="เช่น Locker Room A-1" 
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea v-model="createForm.description" rows="2" placeholder="มีตำหนิ มีรอยขีดข่วน มีสติกเกอร์แปะ หรือจุดสังเกตเฉพาะตัว..."
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">สถานที่พบเจอ <span class="text-red-500">*</span></label>
              <input v-model="createForm.place" type="text" required placeholder="เช่น ห้องเรียน 2434 ชั้น 3"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">วันที่ทำหาย/พบเจอ <span class="text-red-500">*</span></label>
              <input v-model="createForm.date" type="datetime-local" required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition" />
            </div>
          </div>

          <!-- Finder Details Section -->
          <div class="border-t border-slate-100 pt-3">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ข้อมูลผู้พบของ / ผู้นำส่ง</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">ประเภทผู้ส่ง</label>
                <select v-model="createForm.finder_type" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs transition focus:ring-2 focus:ring-indigo-500">
                  <option value="student">นักศึกษา (Student)</option>
                  <option value="staff">พนักงาน/อาจารย์ (Staff)</option>
                  <option value="external">บุคคลภายนอก (External)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input v-model="createForm.finder_phoneNumber" type="text" placeholder="เช่น 089-xxxxxxx"
                  class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition" />
              </div>
            </div>
          </div>

          <!-- Picture Selection -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">รูปภาพประกอบสิ่งของ</label>
            <input @change="handleCreateFileUpload" type="file" accept="image/*" 
              class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            <p class="text-xs text-slate-400 mt-1" v-if="createImageFile">เลือกรูปภาพแล้ว: {{ createImageFile.name }}</p>
          </div>

          <!-- Footer Buttons -->
          <div class="pt-4 flex gap-3 border-t border-slate-100">
            <button type="button" @click="closeCreateModal" 
              class="w-1/3 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 text-sm transition">
              ยกเลิก
            </button>
            <button type="submit" :disabled="isSubmitting" 
              class="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center disabled:opacity-50">
              <span v-if="isSubmitting" class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'

const authStore = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

// States
const items = ref([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')

// Modal States
const showCreateModal = ref(false)
const isSubmitting = ref(false)
const createImageFile = ref<File | null>(null)
const createForm = ref({
  name: '',
  category: '',
  place: '',
  date: '',
  description: '',
  status: 'stored',
  locker: '',
  finder_type: 'student',
  finder_phoneNumber: '',
  finder_studentId: '',
  finder_universityEmail: '',
  namereport: '',
  staffName: ''
})

onMounted(() => {
  authStore.initAuth()
  if (!authStore.isAuthenticated) {
    alert('กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้านี้')
    router.push('/')
    return
  }
  fetchItems()
})

const fetchItems = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${config.public.apiBaseUrl}/lost-items`)
    items.value = response.data
  } catch (error) {
    console.error('Error fetching items:', error)
    if (authStore.token === 'bypass-token-12345') {
      items.value = [
        {
          id: 1,
          name: 'กระเป๋าสตางค์หนังสีน้ำตาล',
          category: 'ของใช้ส่วนตัว',
          place: 'ห้องน้ำชั้น 2 อาคาร 24',
          date: new Date(),
          description: 'กระเป๋าหนังผู้ชาย มีบัตรนักศึกษา UTCC ข้างใน',
          status: 'stored',
          locker: 'ตู้ A-10',
          image_url: null,
          User: { username: 'BypassAdmin' }
        },
        {
          id: 2,
          name: 'iPad Pro พร้อม Apple Pencil',
          category: 'อุปกรณ์อิเล็กทรอนิกส์',
          place: 'โรงอาหารกลาง มหาวิทยาลัยหอการค้าไทย',
          date: new Date(),
          description: 'ไอแพดมีเคสสีเขียวพาสเทล ลืมวางไว้ที่โรงอาหารหลัก',
          status: 'stored',
          locker: 'ตู้ B-05',
          image_url: null,
          User: { username: 'BypassAdmin' }
        }
      ]
    }
  } finally {
    loading.value = false
  }
}

// Modal control
const openCreateModal = () => {
  // Reset form
  createForm.value = {
    name: '',
    category: '',
    place: '',
    date: dayjs().format('YYYY-MM-DDTHH:mm'),
    description: '',
    status: 'stored',
    locker: '',
    finder_type: 'student',
    finder_phoneNumber: '',
    finder_studentId: '',
    finder_universityEmail: '',
    namereport: authStore.user?.username || 'Staff',
    staffName: authStore.user?.username || 'Staff'
  }
  createImageFile.value = null
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const handleCreateFileUpload = (event: any) => {
  createImageFile.value = event.target.files[0]
}

const submitCreateForm = async () => {
  isSubmitting.value = true
  try {
    if (authStore.token === 'bypass-token-12345') {
      // Mock bypass behavior
      const newMockItem = {
        id: Date.now(),
        name: createForm.value.name,
        category: createForm.value.category,
        place: createForm.value.place,
        date: new Date(createForm.value.date),
        description: createForm.value.description,
        status: createForm.value.status,
        locker: createForm.value.locker,
        image_url: null,
        User: { username: authStore.user?.username || 'BypassAdmin' }
      }
      items.value.unshift(newMockItem)
      showCreateModal.value = false
      return
    }

    // 1. Create Lost Item row
    const response = await axios.post(`${config.public.apiBaseUrl}/lost-items`, createForm.value, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    const newItemId = response.data.id

    // 2. Upload image if selected
    if (createImageFile.value && newItemId) {
      const imgData = new FormData()
      imgData.append('image', createImageFile.value)
      
      await axios.post(`${config.public.apiBaseUrl}/lost-items/${newItemId}/upload-image`, imgData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authStore.token}`
        }
      })
    }

    // Refresh and close modal
    await fetchItems()
    showCreateModal.value = false
    alert('บันทึกข้อมูลเรียบร้อยแล้ว!')

  } catch (error) {
    console.error('Error submitting item:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  } finally {
    isSubmitting.value = false
  }
}

// คัดกรองข้อมูล
const filteredItems = computed(() => {
  let result = items.value

  if (statusFilter.value !== 'all') {
    result = result.filter(item => item.status === statusFilter.value)
  }

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.place && item.place.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    )
  }

  return result
})

const countStatus = (status: string) => {
  return items.value.filter(item => item.status === status).length
}

const formatDate = (date: any) => {
  return dayjs(date).format('DD MMM YYYY HH:mm น.')
}

const changeStatus = async (id: number, newStatus: string) => {
  try {
    if (authStore.token === 'bypass-token-12345') {
      const idx = items.value.findIndex(item => item.id === id)
      if (idx !== -1) items.value[idx].status = newStatus
      return
    }

    await axios.put(`${config.public.apiBaseUrl}/lost-items/${id}`, {
      status: newStatus
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    const idx = items.value.findIndex(item => item.id === id)
    if (idx !== -1) items.value[idx].status = newStatus

  } catch (error) {
    console.error('Error changing status:', error)
    alert('เกิดข้อผิดพลาดในการแก้ไขสถานะ')
  }
}

const deleteItem = async (id: number) => {
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการบันทึกนี้ออกจากระบบอย่างถาวร?')) return

  try {
    if (authStore.token === 'bypass-token-12345') {
      items.value = items.value.filter(item => item.id !== id)
      return
    }

    await axios.delete(`${config.public.apiBaseUrl}/lost-items/delete/${id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    items.value = items.value.filter(item => item.id !== id)

  } catch (error) {
    console.error('Error deleting item:', error)
    alert('เกิดข้อผิดพลาดในการลบข้อมูล')
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>
