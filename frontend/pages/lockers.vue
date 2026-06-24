<template>
  <div class="space-y-6">

    <div class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div class="pt-6 mb-6">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">ผังการจัดเก็บตู้ล็อกเกอร์ (Locker Room Map)</h3>
        <p class="text-xs text-slate-400 mt-1">แสดงสถานะความหนาแน่นและการจัดเก็บตู้ในคลังอาคาร 24</p>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-emerald-600">{{ lockersList.filter(l => l.status === 'empty').length }}</p>
          <p class="text-xs text-emerald-700 font-semibold mt-1">ตู้ว่าง</p>
        </div>
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-amber-600">{{ lockersList.filter(l => l.status === 'occupied').length }}</p>
          <p class="text-xs text-amber-700 font-semibold mt-1">ตู้ที่ใช้งาน</p>
        </div>
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
          <p class="text-2xl font-black text-slate-700">12</p>
          <p class="text-xs text-slate-600 font-semibold mt-1">ตู้ทั้งหมด</p>
        </div>
      </div>
      
      <!-- Grid Layout -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="locker in lockersList" :key="locker.name" 
          @click="selectLocker(locker)"
          :class="{
            'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer hover:border-emerald-350 hover:shadow-md': locker.status === 'empty',
            'border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer hover:border-amber-350 hover:shadow-md': locker.status === 'occupied'
          }"
          class="border rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm transition-all duration-200">
          
          <div class="flex justify-between items-start">
            <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-white shadow-sm border border-slate-100">
              <font-awesome :icon="['fas', 'box-archive']" class="text-slate-500 text-xs" />
            </span>
            <span :class="{
              'bg-emerald-100 text-emerald-800 border-emerald-200': locker.status === 'empty',
              'bg-amber-100 text-amber-800 border-amber-200': locker.status === 'occupied'
            }" class="px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider">
              {{ locker.status === 'empty' ? 'ตู้ว่าง' : 'เก็บของ' }}
            </span>
          </div>
          
          <div class="mt-4">
            <h4 class="text-xs font-bold text-slate-800 font-mono">{{ locker.name }} ({{ locker.monthName }})</h4>
            <p v-if="locker.status === 'occupied'" class="text-[10px] text-slate-650 font-medium truncate mt-1">
              จำนวน: <span class="font-bold text-slate-800">{{ locker.items.length }} รายการ</span>
            </p>
            <p v-if="locker.status === 'occupied'" class="text-[9px] text-slate-400 font-medium mt-0.5">
              ล่าสุด: {{ formatDate(locker.items[0]?.date) }}
            </p>
            <p v-else class="text-[10px] text-slate-400 mt-1 font-medium italic">ตู้ว่างพร้อมจัดเก็บสิ่งของที่พบใหม่</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Locker Items Detail Modal -->
    <div v-if="showLockerModal && selectedLocker" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-100 overflow-hidden animate-scale-up">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600">
              <font-awesome :icon="['fas', 'box-archive']" class="text-sm" />
            </span>
            <div>
              <h3 class="text-sm font-bold text-slate-800 font-mono">{{ selectedLocker.name }}</h3>
              <p class="text-[10px] text-slate-500 font-medium">ตู้ล็อกเกอร์ประจำเดือน {{ selectedLocker.monthName }}</p>
            </div>
          </div>
          <button @click="showLockerModal = false" class="text-slate-400 hover:text-slate-650 hover:bg-slate-100 p-1.5 rounded-lg transition">
            <font-awesome :icon="['fas', 'xmark']" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 max-h-[450px] overflow-y-auto">
          <!-- Empty Locker State -->
          <div v-if="selectedLocker.items.length === 0" class="text-center py-12">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-lg mx-auto shadow-sm mb-4">
              <font-awesome :icon="['fas', 'check-double']" />
            </div>
            <h4 class="text-xs font-bold text-slate-700">ไม่มีสิ่งของในตู้นี้</h4>
            <p class="text-[10px] text-slate-400 mt-1 font-medium">ตู้ล็อกเกอร์นี้ยังว่างอยู่ พร้อมสำหรับจัดเก็บสิ่งของที่พบเจอใหม่</p>
          </div>

          <!-- Stored Items List -->
          <div v-else class="space-y-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-bold text-slate-450 uppercase tracking-wider">รายการสิ่งของที่จัดเก็บ ({{ selectedLocker.items.length }})</span>
            </div>
            
            <div class="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <div v-for="item in selectedLocker.items" :key="item.id" class="p-4 bg-white hover:bg-slate-50/50 flex gap-4 transition duration-150">
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
                      <span class="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-100/50 uppercase tracking-wider shrink-0">
                        {{ translateCategory(item.category) }}
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed" v-if="item.description">{{ formatDescription(item.description) }}</p>
                    <p class="text-[10px] text-slate-400 italic mt-1" v-else>ไม่มีรายละเอียดคำอธิบายของ</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100/60 text-[9px] text-slate-450 font-medium font-mono">
                    <span>ID: {{ getMockCode(item) }}</span>
                    <span>ผู้จัดเก็บ/ผู้พบเจอ: {{ item.founder || 'ไม่ได้ระบุ' }}</span>
                    <span>วันที่พบ: {{ formatDate(item.date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex justify-end">
          <button @click="showLockerModal = false" class="px-4 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 hover:border-slate-350 text-slate-650 text-xs font-bold rounded-xl transition duration-150 shadow-sm">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useItemsStore } from '~/stores/items'
import { useItemHelpers } from '~/composables/useItemHelpers'

definePageMeta({ layout: 'dashboard', title: 'ตู้เก็บของ (Lockers)', icon: 'database' })

const itemsStore = useItemsStore()
const { formatDate, translateCategory, getMockCode, getItemImageSrc, formatDescription } = useItemHelpers()

const selectedLocker = ref<any>(null)
const showLockerModal = ref(false)

const selectLocker = (locker: any) => {
  selectedLocker.value = locker
  showLockerModal.value = true
}

const lockersList = computed(() => {
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  const list = []
  for (let i = 1; i <= 12; i++) {
    const name = `ล็อกเกอร์ ที่ - ${i}`
    const itemsInLocker = itemsStore.items.filter(item =>
      item.locker &&
      (item.locker === name || item.locker.includes(`ที่ - ${i}`) || item.locker.includes(`ที่ -${i}`)) &&
      (item.status === 'stored' || item.status === 'found')
    )
    list.push({
      name,
      monthIndex: i,
      monthName: monthNames[i - 1],
      status: itemsInLocker.length > 0 ? 'occupied' : 'empty',
      items: itemsInLocker
    })
  }
  return list
})
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
  animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
