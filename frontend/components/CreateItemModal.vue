<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
    <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-6xl w-full transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 select-none">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <font-awesome :icon="['fas', 'briefcase']" class="text-lg" />
          </div>
          <div>
            <h2 class="text-base font-black text-slate-800 tracking-tight">{{ editItem ? 'แก้ไขข้อมูลสิ่งของที่พบ' : 'แจ้งสิ่งของที่พบ' }}</h2>
            <p class="text-slate-400 text-xs font-semibold mt-0.5">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อความรวดเร็วในการติดตาม</p>
          </div>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition duration-150">
          <font-awesome :icon="['fas', 'xmark']" class="text-sm" />
        </button>
      </div>
      
      <!-- Form -->
      <form @submit.prevent="submitForm" class="flex flex-col flex-1 min-h-0">
        <div class="p-8 overflow-y-auto flex-1 bg-slate-50/20">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Column 1: ข้อมูลสิ่งของ -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold">
                  <font-awesome :icon="['fas', 'box']" class="text-[11px]" />
                </div>
                <h3 class="text-xs font-extrabold text-blue-600 uppercase tracking-wider">ข้อมูลสิ่งของ</h3>
              </div>

              <!-- ชื่อสิ่งของ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">ชื่อสิ่งของ <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.item_name" type="text" required placeholder="เช่น กระเป๋าสตางค์, iPad Pro" 
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'tag']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- หมวดหมู่สิ่งของ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">หมวดหมู่สิ่งของ <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select v-model="form.category_id" required class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                    <option value="" disabled>เลือกประเภทหมวดหมู่</option>
                    <option v-for="cat in itemsStore.categories" :key="cat.category_id" :value="cat.category_id">
                      {{ cat.category_name }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
                  </div>
                </div>
              </div>

              <!-- สถานที่พบ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">สถานที่พบ <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select v-model="form.location_id" required class="w-full pl-4 pr-12 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                    <option value="" disabled>เลือกสถานที่พบ</option>
                    <option v-for="loc in itemsStore.locations" :key="loc.location_id" :value="loc.location_id">
                      {{ loc.location_name }}
                    </option>
                    <option value="custom">อื่นๆ (ระบุเอง)</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 gap-1.5">
                    <font-awesome :icon="['fas', 'location-dot']" class="text-xs" />
                    <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
                  </div>
                </div>
              </div>

              <!-- ระบุสถานที่เอง -->
              <transition name="fade">
                <div v-if="form.location_id === 'custom'" class="mt-3">
                  <label class="block text-xs font-bold text-slate-650 mb-1.5">ระบุสถานที่พบเอง <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <input v-model="customLocationName" type="text" required placeholder="ระบุสถานที่ เช่น อาคารเรียน 3 ห้อง 302"
                      class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                      <font-awesome :icon="['fas', 'location-dot']" class="text-xs" />
                    </div>
                  </div>
                </div>
              </transition>

              <!-- วันและเวลาที่พบ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">วันและเวลาที่พบ <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.found_date" type="datetime-local" required
                    @click="showDateTimePicker"
                    @focus="showDateTimePicker"
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'calendar-days']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- รายละเอียดเพิ่มเติม -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">รายละเอียดเพิ่มเติม</label>
                <textarea v-model="form.description" rows="3" placeholder="ระบุตำหนิ สี สติกเกอร์ หรือจุดสังเกตเฉพาะ..."
                  class="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition resize-none"></textarea>
              </div>
            </div>

            <!-- Column 2: ข้อมูลผู้พบส่ง -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold">
                  <font-awesome :icon="['fas', 'user']" class="text-[11px]" />
                </div>
                <h3 class="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">ข้อมูลผู้พบส่ง</h3>
              </div>

              <!-- ชื่อผู้พบส่ง -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">ชื่อผู้พบส่ง <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.finder_name" type="text" required placeholder="เช่น นายสมชาย ดีใจ"
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'user']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- ประเภทสถานะผู้พบ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">ประเภทสถานะผู้พบ <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select v-model="form.finder_type" required class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                    <option value="STUDENT">นักศึกษา</option>
                    <option value="STAFF">พนักงาน / อาจารย์</option>
                    <option value="EXTERNAL">บุคคลภายนอก</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
                  </div>
                </div>
              </div>

              <!-- เบอร์โทรศัพท์ติดต่อ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">เบอร์โทรศัพท์ติดต่อ <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.finder_phoneNumber" type="tel" required placeholder="เช่น 081-234-5678" maxlength="10"
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'phone']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- แสดงเพิ่มเมื่อเป็น "นักศึกษา" -->
              <transition name="fade">
                <div v-if="form.finder_type === 'STUDENT'" class="space-y-4">
                  <!-- เลขทะเบียนนักศึกษา -->
                  <div>
                    <label class="block text-xs font-bold text-slate-650 mb-1.5">เลขทะเบียนนักศึกษา <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input v-model="form.finder_studentId" type="text" :required="form.finder_type === 'STUDENT'" placeholder="เช่น 64010123456"
                        class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                        <font-awesome :icon="['fas', 'id-card']" class="text-xs" />
                      </div>
                    </div>
                  </div>

                  <!-- อีเมลมหาวิทยาลัย -->
                  <div>
                    <label class="block text-xs font-bold text-slate-650 mb-1.5">อีเมลมหาวิทยาลัย <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input v-model="form.finder_universityEmail" type="email" :required="form.finder_type === 'STUDENT'" placeholder="เช่น student@university.ac.th"
                        class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                        <font-awesome :icon="['fas', 'envelope']" class="text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Column 3: ข้อมูลการจัดเก็บ -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold">
                  <font-awesome :icon="['fas', 'database']" class="text-[11px]" />
                </div>
                <h3 class="text-xs font-extrabold text-blue-600 uppercase tracking-wider">ข้อมูลการจัดเก็บ</h3>
              </div>

              <!-- รูปภาพสิ่งของ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">รูปภาพสิ่งของ <span class="text-red-500">*</span></label>
                
                <!-- Drag and Drop Zone -->
                <div class="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col items-center justify-center text-center cursor-pointer relative group"
                     @dragover.prevent
                     @drop.prevent="handleDrop"
                     @click="triggerFileInput">
                  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleCreateFileUpload" />
                  
                  <div v-if="!previewUrl" class="flex flex-col items-center">
                    <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition duration-200">
                      <font-awesome :icon="['fas', 'cloud-arrow-up']" class="text-lg" />
                    </div>
                    <span class="text-xs font-extrabold text-slate-700">คลิกหรือลากไฟล์มาวางที่นี่</span>
                    <span class="text-[9px] text-slate-400 mt-1">รองรับไฟล์ JPG, JPEG, PNG (ขนาดไม่เกิน 10MB)</span>
                    <button type="button" class="mt-4 px-4 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-indigo-650 bg-white hover:bg-indigo-50/30 shadow-sm transition flex items-center gap-1.5">
                      <font-awesome :icon="['fas', 'file-image']" class="text-[10px] text-indigo-400" /> เลือกไฟล์
                    </button>
                  </div>
                  <div v-else class="w-full flex flex-col items-center">
                    <div class="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black/5 flex items-center justify-center">
                      <img :src="previewUrl" class="max-h-full max-w-full object-contain" />
                      <button type="button" @click.stop="removeImage" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center text-xs transition">
                        &times;
                      </button>
                    </div>
                    <span class="text-[10px] text-slate-500 mt-2 font-semibold truncate max-w-[200px]">{{ imageFile?.name }}</span>
                  </div>
                </div>
              </div>

              <!-- รหัสตู้ล็อกเกอร์ที่จัดเก็บ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">
                  รหัสตู้ล็อกเกอร์ที่จัดเก็บ
                  <span class="text-[10px] text-slate-400 font-normal ml-1">(ถ้ามี เช่น L01, L-03)</span>
                </label>
                <div class="relative">
                  <input v-model="form.locker_id" type="text" placeholder="เช่น L01, ตู้ A-02"
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'lock']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- ข้อมูลความเป็นส่วนตัว -->
              <div class="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-700 mt-4 shadow-sm shadow-blue-100/10">
                <font-awesome :icon="['fas', 'circle-info']" class="text-base text-blue-500 shrink-0 mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <h4 class="text-[11px] font-bold text-blue-800">ข้อมูลของคุณจะถูกเก็บเป็นความลับ</h4>
                  <p class="text-[10px] text-blue-650 leading-relaxed font-semibold">ข้อมูลทั้งหมดจะถูกนำไปใช้เพื่อการติดตามสิ่งของเท่านั้น และจะไม่เปิดเผยต่อบุคคลภายนอก</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button type="button" @click="$emit('close')" 
            class="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 text-xs transition duration-150">
            ยกเลิก
          </button>
          <button type="submit" :disabled="isSubmitting" 
            class="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-500/10">
            <span v-if="isSubmitting" class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
            <font-awesome v-else :icon="['fas', 'paper-plane']" class="text-[10px]" />
            {{ isSubmitting ? 'กำลังบันทึกข้อมูล...' : (editItem ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useItemsStore } from '~/stores/items'

const props = defineProps({
  show: Boolean,
  isSubmitting: Boolean,
  username: {
    type: String,
    default: 'Staff'
  },
  editItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const itemsStore = useItemsStore()

const showDateTimePicker = (event) => {
  const target = event.target
  if (target && typeof target.showPicker === 'function') {
    target.showPicker()
  }
}

const form = ref({
  item_name: '',
  category_id: '',
  location_id: '',
  found_date: '',
  description: '',
  status: 'STORED',
  locker_id: '',
  finder_name: '',
  finder_type: 'STAFF',
  finder_phoneNumber: '',
  finder_studentId: '',
  finder_universityEmail: ''
})

const imageFile = ref(null)
const previewUrl = ref('')
const fileInput = ref(null)
const customLocationName = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    // Ensure master data is fetched from the database
    if (itemsStore.categories.length === 0 || itemsStore.locations.length === 0) {
      itemsStore.fetchMasterData()
    }
    if (props.editItem) {
      form.value = {
        item_name: props.editItem.name || '',
        category_id: props.editItem.category_id || '',
        location_id: props.editItem.location_id || '',
        found_date: dayjs(props.editItem.date).format('YYYY-MM-DDTHH:mm'),
        description: props.editItem.description || '',
        status: props.editItem.status ? props.editItem.status.toUpperCase() : 'STORED',
        locker_id: props.editItem.locker_id || '',
        finder_name: props.editItem.finderName || '',
        finder_type: props.editItem.finderType || 'STAFF',
        finder_phoneNumber: props.editItem.finderPhone || '',
        finder_studentId: props.editItem.finderStudentId || '',
        finder_universityEmail: props.editItem.finderEmail || ''
      }
      previewUrl.value = props.editItem.image_url || ''
      imageFile.value = null
      customLocationName.value = ''
    } else {
      form.value = {
        item_name: '',
        category_id: '',
        location_id: '',
        found_date: dayjs().format('YYYY-MM-DDTHH:mm'),
        description: '',
        status: 'STORED',
        locker_id: '',
        finder_name: '',
        finder_type: 'STAFF',
        finder_phoneNumber: '',
        finder_studentId: '',
        finder_universityEmail: ''
      }
      imageFile.value = null
      previewUrl.value = ''
      customLocationName.value = ''
    }
  }
})


const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleCreateFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    imageFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  previewUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const submitForm = async () => {
  if (!props.editItem && !imageFile.value) {
    alert('กรุณาอัปโหลดรูปภาพสิ่งของ')
    return
  }

  let finalLocationId = form.value.location_id
  if (finalLocationId === 'custom') {
    if (!customLocationName.value.trim()) {
      alert('กรุณากรอกสถานที่พบ')
      return
    }
    try {
      const newLoc = await itemsStore.createLocation(customLocationName.value.trim())
      finalLocationId = newLoc.location_id || newLoc.id
    } catch (error) {
      console.error('Failed to create location:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกสถานที่ใหม่')
      return
    }
  }

  const itemData = {
    item_name: form.value.item_name,
    category_id: parseInt(form.value.category_id),
    location_id: parseInt(finalLocationId),
    found_date: form.value.found_date,
    description: form.value.description,
    status: form.value.status,
    locker_id: form.value.locker_id || null  // VARCHAR — send as-is
  }

  const finderData = {
    person_type: form.value.finder_type,
    full_name: form.value.finder_name,
    student_id: form.value.finder_type === 'STAFF' ? form.value.finder_studentId : null,
    email: form.value.finder_type === 'STAFF' ? form.value.finder_universityEmail : null,
    phone: form.value.finder_phoneNumber
  }

  emit('submit', { itemData, finderData }, imageFile.value)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
