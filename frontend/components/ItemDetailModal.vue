<template>
  <transition name="modal">
    <div v-if="show && item" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 sm:p-6 transition-all font-sans" @click.self="$emit('close')">
      <div :class="[
        (item.status === 'claimed' || item.status === 'returned') ? 'max-w-7xl' : 'max-w-5xl'
      ]" class="bg-white rounded-3xl shadow-2xl overflow-hidden w-full flex flex-col border border-slate-100 modal-card transition-all duration-300">
      
      <!-- Main Content Split (Left & Right) -->
      <div class="flex flex-col md:flex-row flex-1">
        
        <!-- Left side: Full-bleed Image -->
        <div class="w-full md:w-[38%] bg-slate-100 relative min-h-[350px] md:min-h-[auto] shrink-0">
          <img v-if="activeImage" :src="activeImage" class="w-full h-full object-cover select-none absolute inset-0" />
          <div v-else class="text-6xl text-slate-355 absolute inset-0 flex items-center justify-center">
            <font-awesome :icon="['fas', 'image']" />
          </div>
          
          <!-- Mock/Ref Code Badge -->
          <div class="absolute top-4 left-4 flex gap-2 z-10">
            <span class="px-2.5 py-1.5 text-[10px] font-bold rounded-lg shadow-sm bg-white/95 text-slate-800 border border-slate-200/50 flex items-center gap-1">
              <font-awesome :icon="['fas', 'tag']" class="text-slate-400 text-[10px]" />
              {{ getMockCode(item) }}
            </span>
          </div>

          <!-- Zoom Button -->
          <button @click="zoomImage" class="absolute top-4 right-4 w-9 h-9 bg-white/95 hover:bg-white rounded-lg shadow-sm border border-slate-200/40 flex items-center justify-center text-slate-700 transition duration-150 z-10">
            <font-awesome :icon="['fas', 'magnifying-glass-plus']" class="text-xs" />
          </button>
        </div>

        <!-- Right side: Details and information -->
        <div class="w-full md:w-[62%] p-8 flex flex-col justify-between bg-white md:border-l border-slate-100">
          
          <!-- Case A: Item is Claimed/Returned (Two Column Sub-Layout for Details + Claim Info) -->
          <div v-if="item.status === 'claimed' || item.status === 'returned'" class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
            <!-- Left panel: Details -->
            <div class="lg:col-span-7 space-y-6">
              <!-- Header (Title & Badges) -->
              <div class="flex justify-between items-start">
                <div class="space-y-2.5">
                  <h2 class="text-xl font-black text-slate-800 leading-snug tracking-tight">{{ item.name }}</h2>
                  <div class="flex flex-wrap gap-2">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/60 text-indigo-750 rounded-full text-[11px] font-extrabold border border-indigo-100/50">
                      <font-awesome :icon="['fas', 'circle-down']" class="text-indigo-500 text-[10px]" />
                      {{ translateCategory(item.category) }}
                    </span>
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/60 text-emerald-750 border border-emerald-100/50 rounded-full text-[11px] font-extrabold border">
                      <font-awesome :icon="['fas', 'circle-check']" class="text-emerald-600 text-[10px]" />
                      {{ $t('ส่งคืนแล้ว (CLAIMED)') }}
                    </span>
                  </div>
                </div>
                <button class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-50">
                  <font-awesome :icon="['fas', 'ellipsis-vertical']" class="text-sm" />
                </button>
              </div>

              <!-- Detail Card Grid (2x2) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Location Card -->
                <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                  <div class="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <font-awesome :icon="['fas', 'location-dot']" class="text-rose-500 text-sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('สถานที่ที่พบ') }}</p>
                    <p class="text-xs font-bold text-slate-800 truncate" :title="item.place">{{ item.place || '-' }}</p>
                  </div>
                </div>

                <!-- Date Card -->
                <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                  <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <font-awesome :icon="['fas', 'calendar-days']" class="text-indigo-500 text-sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('วันที่และเวลาบันทึกของ') }}</p>
                    <p class="text-xs font-bold text-slate-800 truncate" :title="formatFullDate(item.date)">{{ formatFullDate(item.date) }}</p>
                  </div>
                </div>

                <!-- Locker Card -->
                <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                  <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <font-awesome :icon="['fas', 'box']" class="text-amber-500 text-sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('ตู้ล็อกเกอร์จัดเก็บ') }}</p>
                    <p class="text-xs font-bold text-slate-800 truncate" :title="item.locker">{{ item.locker || '-' }}</p>
                  </div>
                </div>

                <!-- Staff Card / Reporter Card -->
                <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                  <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <font-awesome :icon="['fas', 'user']" class="text-blue-500 text-sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('เจ้าหน้าที่ผู้บันทึก') }}</p>
                    <p class="text-xs font-bold text-slate-800 truncate" :title="item.staffName">{{ item.staffName || 'Admin' }}</p>
                  </div>
                </div>
              </div>

              <!-- Description Section -->
              <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div class="flex items-center gap-2 mb-2 text-slate-700">
                  <font-awesome :icon="['fas', 'file-lines']" class="text-slate-400 text-sm" />
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-555">{{ $t('รายละเอียดเพิ่มเติม') }}</p>
                </div>
                <div class="bg-slate-50/70 border border-slate-100 rounded-xl p-3 min-h-[70px]">
                  <p class="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{{ formatDescription(item.description) }}</p>
                </div>
              </div>
            </div>

            <!-- Right panel: Claimed/Returned Information with Emerald Green BG -->
            <div class="lg:col-span-5 bg-emerald-50 border border-emerald-200/60 p-6 rounded-3xl space-y-4 self-stretch shadow-sm shadow-emerald-100/10 flex flex-col justify-start">
              <div class="flex items-center gap-2 text-emerald-700">
                <font-awesome :icon="['fas', 'hand-holding-hand']" class="text-emerald-600 text-sm" />
                <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{{ $t('ข้อมูลการรับคืนสิ่งของ') }}</p>
              </div>
              <div class="divide-y divide-emerald-200/50 text-xs flex-1">
                <div class="flex justify-between py-2.5">
                  <span class="text-emerald-800/75 font-semibold">{{ $t('ผู้รับคืน') }}</span>
                  <span class="font-extrabold text-emerald-950">{{ item.claimerName || '-' }}</span>
                </div>
                <div class="flex justify-between py-2.5">
                  <span class="text-emerald-800/75 font-semibold">{{ $t('ประเภทบุคคล') }}</span>
                  <span class="font-extrabold text-emerald-950">
                    {{ item.claimerType === 'STUDENT' ? $t('นักศึกษา') : item.claimerType === 'STAFF' ? $t('บุคลากร') : item.claimerType === 'MAID' ? $t('แม่บ้าน') : item.claimerType === 'SECURITY' ? $t('เจ้าหน้าที่รักษาความปลอดภัย') : $t('บุคคลภายนอก') }}
                  </span>
                </div>
                <div v-if="item.claimerStudentId" class="flex justify-between py-2.5">
                  <span class="text-emerald-800/75 font-semibold">{{ $t('รหัสนักศึกษา') }}</span>
                  <span class="font-extrabold text-emerald-950 font-mono">{{ item.claimerStudentId }}</span>
                </div>
                <div class="flex justify-between py-2.5">
                  <span class="text-emerald-800/75 font-semibold">{{ $t('เบอร์โทรศัพท์') }}</span>
                  <span class="font-extrabold text-emerald-950 font-mono">{{ item.claimerPhone || '-' }}</span>
                </div>
                <div v-if="item.claimerEmail" class="flex justify-between py-2.5">
                  <span class="text-emerald-800/75 font-semibold">{{ $t('อีเมล') }}</span>
                  <span class="font-extrabold text-emerald-950 font-mono">{{ item.claimerEmail }}</span>
                </div>
                <div class="flex justify-between py-2.5">
                  <span class="text-emerald-800/75 font-semibold">{{ $t('วันที่รับคืน') }}</span>
                  <span class="font-extrabold text-emerald-950">{{ formatFullDate(item.claim_date) }}</span>
                </div>
                <div v-if="item.remark" class="flex flex-col py-2.5 gap-1.5">
                  <span class="text-emerald-800/75 font-semibold">{{ $t('หมายเหตุ / บันทึกเพิ่มเติม') }}</span>
                  <span class="font-semibold text-emerald-900 bg-white/70 p-2.5 rounded-xl border border-emerald-200/50 leading-relaxed">{{ item.remark }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Case B: Standard Single Column Layout (Not Claimed/Returned) -->
          <div v-else class="space-y-6 flex-1">
            <!-- Header (Title & Badges) -->
            <div class="flex justify-between items-start">
              <div class="space-y-2.5">
                <h2 class="text-xl font-black text-slate-800 leading-snug tracking-tight">{{ item.name }}</h2>
                <div class="flex flex-wrap gap-2">
                  <!-- Category Badge -->
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/60 text-indigo-750 rounded-full text-[11px] font-extrabold border border-indigo-100/50">
                    <font-awesome :icon="['fas', 'circle-down']" class="text-indigo-500 text-[10px]" />
                    {{ translateCategory(item.category) }}
                  </span>
                  
                  <!-- Status Badge -->
                  <span :class="{
                    'bg-rose-50/60 text-rose-750 border-rose-100/50': item.status === 'lost',
                    'bg-emerald-50/60 text-emerald-750 border-emerald-100/50': item.status === 'found' || item.status === 'stored'
                  }" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border">
                    <font-awesome :icon="item.status === 'lost' ? ['fas', 'circle-xmark'] : ['fas', 'circle-check']" :class="item.status === 'lost' ? 'text-rose-500' : 'text-emerald-500'" class="text-[10px]" />
                    {{ item.status === 'lost' ? $t('ของหาย (LOST)') : $t('พบเจอ (FOUND)') }}
                  </span>
                </div>
              </div>
              
              <!-- Context Menu Button (Mock) -->
              <button class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-50">
                <font-awesome :icon="['fas', 'ellipsis-vertical']" class="text-sm" />
              </button>
            </div>

            <!-- Detail Card Grid (2x2) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Location Card -->
              <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                <div class="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <font-awesome :icon="['fas', 'location-dot']" class="text-rose-500 text-sm" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('สถานที่') }}{{ item.type === 'lost' ? $t('หาย') : $t('ที่พบ') }}</p>
                  <p class="text-xs font-bold text-slate-800 truncate" :title="item.place">{{ item.place || '-' }}</p>
                </div>
              </div>

              <!-- Date Card -->
              <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <font-awesome :icon="['fas', 'calendar-days']" class="text-indigo-500 text-sm" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('วันที่และเวลาบันทึกของ') }}</p>
                  <p class="text-xs font-bold text-slate-800 truncate" :title="formatFullDate(item.date)">{{ formatFullDate(item.date) }}</p>
                </div>
              </div>

              <!-- Locker Card -->
              <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <font-awesome :icon="['fas', 'box']" class="text-amber-500 text-sm" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('ตู้ล็อกเกอร์จัดเก็บ') }}</p>
                  <p class="text-xs font-bold text-slate-800 truncate" :title="item.locker">{{ item.locker || '-' }}</p>
                </div>
              </div>

              <!-- Staff Card / Reporter Card -->
              <div class="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow transition duration-150">
                <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <font-awesome :icon="['fas', 'user']" class="text-blue-500 text-sm" />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{{ $t('เจ้าหน้าที่ผู้บันทึก') }}</p>
                  <p class="text-xs font-bold text-slate-800 truncate" :title="item.staffName">{{ item.staffName || 'Admin' }}</p>
                </div>
              </div>
            </div>

            <!-- Description Section -->
            <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div class="flex items-center gap-2 mb-2 text-slate-700">
                <font-awesome :icon="['fas', 'file-lines']" class="text-slate-400 text-sm" />
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-555">{{ $t('รายละเอียดเพิ่มเติม') }}</p>
              </div>
              <div class="bg-slate-50/70 border border-slate-100 rounded-xl p-3 min-h-[70px]">
                <p class="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{{ formatDescription(item.description) }}</p>
              </div>
            </div>

            <!-- Storage Information Section (Original Position) -->
            <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div class="flex items-center gap-2 text-slate-700">
                <font-awesome :icon="['fas', 'box-open']" class="text-indigo-500 text-sm" />
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-555">{{ $t('ข้อมูลการจัดเก็บ') }}</p>
              </div>
              <div class="divide-y divide-slate-100 text-xs">
                <div class="flex justify-between py-2.5">
                  <span class="text-slate-455 font-medium">{{ $t('วันที่จัดเก็บ') }}</span>
                  <span class="font-bold text-slate-800">{{ formatFullDate(item.date) }}</span>
                </div>
                <div class="flex justify-between py-2.5">
                  <span class="text-slate-455 font-medium">{{ $t('ตู้ล็อกเกอร์จัดเก็บ') }}</span>
                  <span class="font-bold text-slate-800">{{ item.locker || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
      <!-- Full-Width Footer Bar -->
      <div class="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between select-none">
        <button @click="$emit('close')" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-550 hover:text-slate-700 text-xs font-extrabold rounded-xl transition duration-150 shadow-sm">
          <font-awesome :icon="['fas', 'arrow-left']" />
            {{ $t('ย้อนกลับ') }}
        </button>
        <button v-if="item.status !== 'claimed' && item.status !== 'returned'" @click="$emit('edit', item)" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition duration-150 shadow-md shadow-indigo-600/10">
          <font-awesome :icon="['fas', 'pen']" />
          {{ $t('แก้ไขข้อมูล') }}
        </button>
      </div>

    </div>
  </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemHelpers } from '~/composables/useItemHelpers'

const props = defineProps<{
  show: boolean
  item: any
}>()

const emit = defineEmits(['close', 'edit'])

const { getItemImageSrc, translateCategory, getMockCode, formatFullDate, formatDescription } = useItemHelpers()

// Image Gallery List
const images = computed(() => {
  const src = getItemImageSrc(props.item)
  if (!src) return []
  return [src, src, src, src]
})

const activeImageIndex = ref(0)
const activeImage = computed(() => images.value[activeImageIndex.value] || null)

const prevImg = () => {
  if (images.value.length === 0) return
  activeImageIndex.value = (activeImageIndex.value - 1 + images.value.length) % images.value.length
}

const nextImg = () => {
  if (images.value.length === 0) return
  activeImageIndex.value = (activeImageIndex.value + 1) % images.value.length
}

const zoomImage = () => {
  if (activeImage.value) {
    window.open(activeImage.value, '_blank')
  }
}

const printDetails = () => {
  window.print()
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: translateY(20px) scale(0.97);
  opacity: 0;
}

@media print {
  body * {
    visibility: hidden;
  }
  .animate-fade-in-up, .animate-fade-in-up * {
    visibility: visible;
  }
  .animate-fade-in-up {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
    box-shadow: none;
  }
}
</style>
