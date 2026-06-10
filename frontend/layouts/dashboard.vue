<template>
  <div class="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
    
    <!-- Left Sidebar Navigation Component -->
    <Sidebar 
      :username="authStore.user?.username" 
      @logout="handleLogout" 
    />    
    
    <!-- Main Content Body -->
    <main class="flex-1 overflow-y-auto h-screen p-4 lg:p-6 space-y-6 relative">

      <!-- Top Header / Navbar -->
      <header class="bg-white rounded-2xl p-4 md:px-6 border border-slate-200/80 shadow-sm flex items-center justify-between sticky top-0 z-30 bg-white/90">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            🎓
          </div>
          <div>
            <h1 class="text-sm font-bold text-slate-800 tracking-tight">UTCC Unifind</h1>
            <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">ระบบติดตามสิ่งของสูญหาย</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Date / Time -->
          <div class="hidden sm:block text-right">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ formattedDate }}</p>
            <p class="text-xs font-semibold text-slate-700">{{ currentTime }}</p>
          </div>
          
          <!-- User Profile Mini -->
          <div class="pl-4 border-l border-slate-100 flex items-center gap-3">
            <div class="text-right hidden md:block">
              <p class="text-xs font-bold text-slate-800">{{ authStore.user?.username || 'เจ้าหน้าที่' }}</p>
              <p class="text-[10px] text-indigo-500 font-medium">แอดมินระบบ</p>
            </div>
            <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
              <span class="text-sm">👤</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content Slot -->
      <slot />
      
    </main>

    <!-- Floating Action Buttons (FABs) on the bottom-right corner -->
    <div class="fixed bottom-6 right-6 flex flex-col gap-3 z-40 select-none">
      <!-- FAB 1: Red - แจ้งของหาย -->
      <button @click="openLostModal" title="แจ้งบันทึกข้อมูลของหาย"
        class="w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative group">
        <span class="text-xl">🔍</span>
        <span class="absolute right-16 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap shadow-md">แจ้งบันทึกของหาย (Lost Item)</span>
      </button>
      
      <!-- FAB 2: Green - แจ้งพบของ -->
      <button @click="openCreateModal" title="แจ้งนำสิ่งของเข้าคลัง"
        class="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative group">
        <span class="text-xl">📦</span>
        <span class="absolute right-16 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap shadow-md">แจ้งพบของส่งเข้าคลัง (Found Item)</span>
      </button>
      
      <!-- FAB 3: Dark - สแกน QR -->
      <button @click="triggerQRScanner" title="สแกน QR Code ติดตามของ"
        class="w-14 h-14 bg-[#1E293B] hover:bg-[#0F172A] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative group">
        <span class="text-lg">📷</span>
        <span class="absolute right-16 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap shadow-md">สแกน QR Code ติดตามของ</span>
      </button>
    </div>

    <!-- Create Item Modal (Found/Stored Items) -->
    <CreateItemModal 
      :show="showCreateModal" 
      :is-submitting="isSubmitting" 
      :username="authStore.user?.username" 
      @close="closeCreateModal" 
      @submit="handleCreateSubmit" 
    />

    <!-- Report Lost Item Modal (Lost Items) -->
    <ReportLostItemModal 
      :show="showLostModal" 
      :is-submitting="isSubmitting" 
      :username="authStore.user?.username" 
      @close="closeLostModal" 
      @submit="handleLostSubmit" 
    />

    <!-- Simulated QR Code Scanner Modal -->
    <div v-if="showQRModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-w-md w-full">
        <div class="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b border-slate-800">
          <h2 class="text-sm font-bold tracking-tight flex items-center gap-2">
            <span>📷</span> กล้องสแกนติดตามสิ่งของ (QR Code Scanner)
          </h2>
          <button @click="showQRModal = false" class="text-slate-400 hover:text-white text-xl font-semibold outline-none">&times;</button>
        </div>
        
        <div class="p-6 flex flex-col items-center justify-center space-y-4">
          <!-- Camera viewfinder mockup -->
          <div class="relative w-full aspect-square max-w-[280px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            <!-- Simulated Scanning Red Line -->
            <div class="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#EF4444] animate-scanline"></div>
            <!-- Grid targeting overlay -->
            <div class="w-48 h-48 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center">
              <span class="text-xs text-white/40 select-none">จัดวาง QR Code ในกรอบ</span>
            </div>
          </div>
          
          <p class="text-xs text-slate-500 font-semibold text-center leading-relaxed">
            ระบบจะเปิดใช้งานเว็บแคมเพื่อสแกน QR Code สำหรับสืบค้นรหัสสิ่งของสูญหาย
          </p>
          
          <button @click="showQRModal = false" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-md">
            ปิดระบบกล้อง
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'
import { useItemsStore } from '~/stores/items'

import Sidebar from '~/components/Sidebar.vue'
import CreateItemModal from '~/components/CreateItemModal.vue'
import ReportLostItemModal from '~/components/ReportLostItemModal.vue'

const authStore = useAuthStore()
const itemsStore = useItemsStore()
const router = useRouter()
const config = useRuntimeConfig()

// Modal Toggle States
const showCreateModal = ref(false)
const showLostModal = ref(false)
const showQRModal = ref(false)
const isSubmitting = ref(false)

// Clock States
const currentTime = ref('')
const formattedDate = ref('')
let timerInterval: any = null

const greetingText = computed(() => {
  const hr = new Date().getHours()
  if (hr < 12) return 'ตอนเช้า'
  if (hr < 16) return 'ตอนบ่าย'
  return 'ตอนเย็น'
})

const updateDateTime = () => {
  const now = new Date()
  formattedDate.value = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
  currentTime.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

onMounted(() => {
  authStore.initAuth()
  if (!authStore.isAuthenticated) {
    alert('กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้านี้')
    router.push('/')
    return
  }
  
  // Fetch items if not loaded yet
  if (itemsStore.items.length === 0) {
    itemsStore.fetchItems()
  }

  updateDateTime()
  timerInterval = setInterval(updateDateTime, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Modal Actions
const openCreateModal = () => { showCreateModal.value = true }
const closeCreateModal = () => { showCreateModal.value = false }
const openLostModal = () => { showLostModal.value = true }
const closeLostModal = () => { showLostModal.value = false }
const triggerQRScanner = () => { showQRModal.value = true }

const handleCreateSubmit = async (formData: any, imageFile: any) => {
  isSubmitting.value = true
  try {
    if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
      const newMockItem = { id: Date.now(), ...formData, image_url: null, staffName: authStore.user?.username || 'BypassAdmin' }
      itemsStore.items.unshift(newMockItem)
      showCreateModal.value = false
      return
    }

    const response = await axios.post(`${config.public.apiBaseUrl}/lost-items`, formData, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    await itemsStore.fetchItems()
    showCreateModal.value = false
    alert('บันทึกข้อมูลเรียบร้อยแล้ว!')
  } catch (error) {
    console.error('Error submitting found item:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  } finally {
    isSubmitting.value = false
  }
}

const handleLostSubmit = async (formData: any, imageFile: any) => {
  isSubmitting.value = true
  try {
    if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
      const newMockItem = { id: Date.now(), ...formData, image_url: null, staffName: authStore.user?.username || 'BypassAdmin' }
      itemsStore.items.unshift(newMockItem)
      showLostModal.value = false
      return
    }

    const response = await axios.post(`${config.public.apiBaseUrl}/lost-items`, formData, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })

    await itemsStore.fetchItems()
    showLostModal.value = false
    alert('บันทึกของหายเรียบร้อยแล้ว!')
  } catch (error) {
    console.error('Error submitting lost item:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  } finally {
    isSubmitting.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
@keyframes scan {
  0% { top: 0%; }
  50% { top: 100%; }
  100% { top: 0%; }
}
.animate-scanline {
  animation: scan 3s linear infinite;
  position: absolute;
}
</style>
