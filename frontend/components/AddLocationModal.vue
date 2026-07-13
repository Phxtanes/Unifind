<template>
  <transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 ">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-up flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 select-none">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-650 shadow-sm">
              <font-awesome :icon="['fas', 'location-dot']" class="text-base" />
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-800 tracking-tight">เพิ่มสถานที่ใหม่</h3>
              <p class="text-[10px] text-slate-400 font-semibold">สร้างสถานที่เพื่อระบุตำแหน่งของสิ่งของ</p>
            </div>
          </div>
          <button @click="$emit('close')" class="w-7 h-7 rounded-full border border-slate-150 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
            <font-awesome :icon="['fas', 'xmark']" class="text-xs" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- ชื่อสถานที่ -->
          <div>
            <label class="block text-xs font-bold text-slate-650 mb-1.5">ชื่อสถานที่ / ห้อง <span class="text-red-500">*</span></label>
            <div class="relative">
              <input v-model="form.location_name" type="text" required placeholder="เช่น ห้อง 302, ลานกิจกรรม" 
                class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <font-awesome :icon="['fas', 'map-pin']" class="text-xs" />
              </div>
            </div>
          </div>

          <!-- อาคาร -->
          <div>
            <label class="block text-xs font-bold text-slate-650 mb-1.5">อาคาร / ตึก (ถ้ามี)</label>
            <div class="relative">
              <select v-model="form.building_id" class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                <option :value="null">ไม่ระบุอาคาร</option>
                <option v-for="bld in itemsStore.buildings" :key="bld.building_id" :value="bld.building_id">
                  {{ bld.building_name }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
              </div>
            </div>
          </div>

          <!-- ชั้น -->
          <div>
            <label class="block text-xs font-bold text-slate-650 mb-1.5">ชั้น</label>
            <div class="relative">
              <input v-model="form.floor" type="number" placeholder="เช่น 1, 3" 
                class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <font-awesome :icon="['fas', 'layer-group']" class="text-xs" />
              </div>
            </div>
          </div>

          <!-- รายละเอียดเพิ่มเติม -->
          <div>
            <label class="block text-xs font-bold text-slate-650 mb-1.5">รายละเอียดเพิ่มเติม</label>
            <textarea v-model="form.description" rows="2" placeholder="ระบุจุดสังเกต หรือรายละเอียดของสถานที่..."
              class="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition resize-none"></textarea>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMsg" class="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <font-awesome :icon="['fas', 'circle-exclamation']" />
            <span>{{ errorMsg }}</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" @click="$emit('close')" class="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition">
              ยกเลิก
            </button>
            <button type="submit" :disabled="loading" class="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-750 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2">
              <font-awesome v-if="loading" :icon="['fas', 'spinner']" class="animate-spin" />
              <span>บันทึก</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useItemsStore } from '~/stores/items'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])
const itemsStore = useItemsStore()

const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  location_name: '',
  building_id: null as number | null,
  floor: null as number | null,
  description: ''
})

// Reset form when modal opens/closes
watch(() => props.show, (newVal) => {
  if (newVal) {
    form.location_name = ''
    form.building_id = null
    form.floor = null
    form.description = ''
    errorMsg.value = ''
  }
})

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const floorVal = form.floor !== null && form.floor !== '' ? Number(form.floor) : null
    const newLoc = await itemsStore.createLocation(form.location_name, form.building_id)
    emit('success', newLoc)
  } catch (err: any) {
    console.error('Error creating location:', err)
    errorMsg.value = err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.bg-emerald-650 {
  background-color: #059669;
}
.bg-emerald-750 {
  background-color: #047857;
}
.text-emerald-655 {
  color: #059669;
}
</style>
