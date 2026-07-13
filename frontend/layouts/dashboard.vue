<template>
  <div class="min-h-screen bg-white flex font-sans text-slate-800">
    
    <!-- Left Sidebar Navigation Component -->
    <Navbar />    
    
    <!-- Main Content Body -->
    <div class="flex-1 flex flex-col min-w-0 h-screen">
      <!-- Top Navbar Component -->
      <TopNavbar :title="pageTitle" :icon="pageIcon" :no-margin="true" class="bg-white/95 sticky top-0 z-30 px-6 border-b border-slate-200 shadow-sm" />

      <main class="flex-1 overflow-y-auto p-4 lg:p-6  relative">
        <!-- Page Content Slot -->
        <slot />
      </main>
    </div>

    <!-- Floating Action Buttons (FABs) on the bottom-right corner -->
    <div class="fixed bottom-6 right-6 flex flex-col gap-3 z-40 select-none">
      <!-- FAB 1: Red - แจ้งของหาย -->
      <button @click="openLostModal" title="แจ้งบันทึกข้อมูลของหาย"
        class="w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative group">
        <font-awesome :icon="['fas', 'magnifying-glass']" class="text-lg" />
        <span class="absolute right-16 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap shadow-md">แจ้งบันทึกของหาย (Lost Item)</span>
      </button>
      
      <!-- FAB 2: Green - แจ้งพบของ -->
      <button @click="openCreateModal" title="แจ้งนำสิ่งของเข้าคลัง"
        class="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative group">
        <font-awesome :icon="['fas', 'box-archive']" class="text-lg" />
        <span class="absolute right-16 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap shadow-md">แจ้งพบของส่งเข้าคลัง (Found Item)</span>
      </button>
      
      <!-- FAB 3: Dark - สแกน QR -->
      <!-- <button @click="triggerQRScanner" title="สแกน QR Code ติดตามของ"
        class="w-14 h-14 bg-[#1E293B] hover:bg-[#0F172A] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 relative group">
        <font-awesome :icon="['fas', 'camera']" class="text-lg" />
        <span class="absolute right-16 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap shadow-md">สแกน QR Code ติดตามของ</span>
      </button> -->
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
            <font-awesome :icon="['fas', 'camera']" class="text-slate-400" /> กล้องสแกนติดตามสิ่งของ (QR Code Scanner)
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

    <!-- AI Matching Result Modal -->
    <div v-if="showMatchModal && matchDetails" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70  flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-w-2xl w-full animate-scale-up">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-650 to-indigo-700 px-6 py-5 text-white flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg animate-pulse">
              <font-awesome :icon="['fas', 'robot']" />
            </div>
            <div>
              <h2 class="text-sm font-bold tracking-wide">AI ตรวจพบสิ่งของใกล้เคียงในระบบ!</h2>
              <p class="text-[10px] text-indigo-100 font-medium">ตรวจวิเคราะห์อัตโนมัติด้วยระบบ Gemini AI</p>
            </div>
          </div>
          <button @click="showMatchModal = false" class="text-white/80 hover:text-white text-xl font-bold outline-none">&times;</button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Matching Percentage Card -->
          <div class="bg-indigo-50/60 border border-indigo-100/80 rounded-2xl p-5 flex items-center gap-5">
            <div class="relative shrink-0 flex items-center justify-center">
              <div class="w-20 h-20 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                <span class="text-2xl font-black text-indigo-600 font-mono">{{ matchDetails.confidence }}%</span>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-bold text-slate-800">เปอร์เซ็นต์ความคล้ายคลึงของข้อมูล</h3>
              <p class="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                {{ matchDetails.reason }}
              </p>
            </div>
          </div>

          <!-- Comparison Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Left Card: Newly Added Item -->
            <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span class="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">
                  รายการที่คุณบันทึกใหม่
                </span>
                <h4 class="font-extrabold text-slate-900 text-xs mt-3">{{ newItemDetails?.name }}</h4>
                <p class="text-[10px] text-slate-500 mt-1 font-medium italic">หมวดหมู่: {{ newItemDetails?.category }}</p>
                <p class="text-[10px] text-slate-600 mt-2 leading-relaxed">
                  {{ newItemDetails?.description || 'ไม่มีระบุคำอธิบาย' }}
                </p>
              </div>
            </div>

            <!-- Right Card: Matched Item in System -->
            <div class="bg-emerald-50/50 border border-emerald-250 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span class="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                  พบข้อมูลที่ตรงกันในระบบ
                </span>
                <h4 class="font-extrabold text-slate-900 text-xs mt-3">{{ matchDetails.matchedItem?.name }}</h4>
                <p class="text-[10px] text-slate-500 mt-1 font-medium italic">
                  ผู้แจ้ง: {{ matchDetails.matchedItem?.reporter || matchDetails.matchedItem?.founder || 'ไม่ได้ระบุ' }}
                </p>
                <p class="text-[10px] text-slate-650 mt-2 leading-relaxed">
                  {{ matchDetails.matchedItem?.description || 'ไม่มีระบุคำอธิบาย' }}
                </p>
              </div>
              <div class="mt-4 pt-3 border-t border-emerald-100/80 text-[9px] text-slate-400 font-medium font-mono flex justify-between">
                <span>ID: {{ matchDetails.matchedItem?.id }}</span>
                <span>วันที่: {{ matchDetails.matchedItem?.date ? new Date(matchDetails.matchedItem.date).toLocaleDateString('th-TH') : '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5 text-amber-800">
            <font-awesome :icon="['fas', 'circle-info']" class="text-xs mt-0.5 shrink-0" />
            <p class="text-[10px] font-medium leading-normal">
              <strong>หมายเหตุ:</strong> ระบบได้ส่งข้อความแจ้งเตือนด่วนผ่าน LINE Bot ไปยังคู่กรณีเรียบร้อยแล้ว แนะนำให้ตรวจสอบหลักฐานความเป็นเจ้าของก่อนรับของคืน
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex justify-end gap-2">
          <button @click="showMatchModal = false" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-150 shadow-md">
            ตกลงและรับทราบ
          </button>
        </div>
      </div>
    </div>

    <!-- Reusable Success Modal -->
    <SuccessModal 
      :show="showSuccessModal" 
      :title="successModalTitle" 
      :message="successModalMessage" 
      @close="showSuccessModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#app'
import { useItemsStore } from '~/stores/items'

import Navbar from '~/components/Navbar.vue'
import TopNavbar from '~/components/TopNavbar.vue'
import CreateItemModal from '~/components/CreateItemModal.vue'
import ReportLostItemModal from '~/components/ReportLostItemModal.vue'

const authStore = useAuthStore()
const itemsStore = useItemsStore()
const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()

const pageTitle = computed(() => (route.meta.title as string) || 'UTCC Unifind')
const pageIcon = computed(() => (route.meta.icon as string) || '')

// Modal Toggle States
const showCreateModal = ref(false)
const showLostModal = ref(false)
const showQRModal = ref(false)
const showMatchModal = ref(false)
const matchDetails = ref<any>(null)
const newItemDetails = ref<any>(null)
const isSubmitting = ref(false)

const showSuccessModal = ref(false)
const successModalTitle = ref('บันทึกสำเร็จ!')
const successModalMessage = ref('')

const triggerSuccess = (title: string, message: string) => {
  successModalTitle.value = title
  successModalMessage.value = message
  showSuccessModal.value = true
}

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
  
  if (itemsStore.items.length === 0) {
    itemsStore.fetchItems()
  }

  updateDateTime()
  timerInterval = setInterval(updateDateTime, 1000)
  window.addEventListener('open-create-modal', openCreateModal)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  window.removeEventListener('open-create-modal', openCreateModal)
})
// Modal Actions
const openCreateModal = () => { showCreateModal.value = true }
const closeCreateModal = () => { showCreateModal.value = false }
const openLostModal = () => { showLostModal.value = true }
const closeLostModal = () => { showLostModal.value = false }
const triggerQRScanner = () => { showQRModal.value = true }

const handleCreateSubmit = async (data: any, imageFile: any) => {
  isSubmitting.value = true
  try {
    const result = await itemsStore.createFoundItem(data.itemData, data.finderData, imageFile)
    showCreateModal.value = false
    if (result && result.aiMatch && result.aiMatch.matched) {
      matchDetails.value = result.aiMatch
      newItemDetails.value = {
        name: data.itemData.item_name,
        category: itemsStore.categories.find(c => Number(c.category_id) === Number(data.itemData.category_id))?.category_name || 'อื่นๆ',
        description: data.itemData.description
      }
      showMatchModal.value = true
    } else {
      triggerSuccess('บันทึกข้อมูลสำเร็จ!', 'ได้จัดทำข้อมูลแจ้งพบของส่งเข้าคลังเรียบร้อยแล้ว')
    }
  } catch (error) {
    console.error('Error submitting found item:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  } finally {
    isSubmitting.value = false
  }
}

const handleLostSubmit = async (data: any, imageFile: any) => {
  isSubmitting.value = true
  try {
    const result = await itemsStore.createLostItem(data.itemData, data.reporterData, imageFile)
    showLostModal.value = false
    if (result && result.aiMatch && result.aiMatch.matched) {
      matchDetails.value = result.aiMatch
      newItemDetails.value = {
        name: data.itemData.item_name,
        category: itemsStore.categories.find(c => Number(c.category_id) === Number(data.itemData.category_id))?.category_name || 'อื่นๆ',
        description: data.itemData.description
      }
      showMatchModal.value = true
    } else {
      triggerSuccess('บันทึกของหายสำเร็จ!', 'ได้จัดทำข้อมูลแจ้งเรื่องของหายเข้าสู่ระบบเรียบร้อยแล้ว')
    }
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
