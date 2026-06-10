<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-w-2xl w-full transition-all duration-300 transform scale-100">
      
      <!-- Header -->
      <div class="bg-slate-800 px-8 py-5 flex justify-between items-center text-white">
        <div>
          <h2 class="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-100">
            <span>🔍</span> แจ้งข้อมูลบันทึกของหาย
          </h2>
          <p class="text-slate-400 text-xs mt-0.5">
            เจ้าหน้าที่ผู้ลงบันทึก: <span class="font-semibold text-slate-200">{{ username || 'ไม่ระบุ' }}</span>
          </p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white text-2xl font-normal outline-none transition duration-150">&times;</button>
      </div>
      
      <!-- Form -->
      <form @submit.prevent="submitForm" class="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
        
        <!-- Section 1: ข้อมูลสิ่งของที่หาย -->
        <div class="space-y-4">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ข้อมูลรายละเอียดสิ่งของที่สูญหาย
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">ชื่อสิ่งของ <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" required placeholder="เช่น กระเป๋าสตางค์, iPad Pro" 
                class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">หมวดหมู่สิ่งของ <span class="text-red-500">*</span></label>
              <select v-model="form.category" required class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition text-slate-700">
                <option value="" disabled>เลือกประเภทหมวดหมู่</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">สถานที่สูญหาย (หรือจุดที่คาดว่าหาย) <span class="text-red-500">*</span></label>
              <input v-model="form.place" type="text" required placeholder="เช่น โรงอาหาร ชั้น 1 หรือ ตึก 10"
                class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">วันที่และเวลาที่คาดว่าหาย <span class="text-red-500">*</span></label>
              <input v-model="form.date" type="datetime-local" required
                class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition text-slate-700" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">รายละเอียดเพิ่มเติม / จุดสังเกตสิ่งของ</label>
            <textarea v-model="form.description" rows="3" placeholder="ระบุแบรนด์ สี รอยตำหนิ สติกเกอร์ หรือลักษณะเฉพาะพิเศษเพื่อใช้ยืนยันความเป็นเจ้าของ..."
              class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition"></textarea>
          </div>
        </div>

        <!-- Section 2: ข้อมูลผู้ทำของหาย (เจ้าของ) -->
        <div class="space-y-4 pt-2">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ข้อมูลรายละเอียดผู้แจ้งทำของหาย
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">ประเภทผู้ทำของหาย <span class="text-red-500">*</span></label>
              <select v-model="form.finder_type" required class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition text-slate-700">
                <option value="student">นักศึกษา</option>
                <option value="staff">พนักงาน / อาจารย์</option>
                <option value="external">บุคคลภายนอก</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์ติดต่อ <span class="text-red-500">*</span></label>
              <input v-model="form.finder_phoneNumber" type="tel" required placeholder="เช่น 081-234-5678"
                class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition" />
            </div>
          </div>

          <!-- แสดงเพิ่มเมื่อเป็น "นักศึกษา" -->
          <div v-if="form.finder_type === 'student'" class="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4 transition-all duration-300">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">เลขทะเบียนนักศึกษา <span class="text-red-500">*</span></label>
                <input v-model="form.finder_studentId" type="text" required placeholder="เช่น 64010123456"
                  class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">อีเมลมหาวิทยาลัย <span class="text-red-500">*</span></label>
                <input v-model="form.finder_universityEmail" type="email" required placeholder="เช่น student@university.ac.th"
                  class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition" />
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: รูปภาพประกอบ (ถ้ามี) -->
        <div class="space-y-4 pt-2">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> รูปภาพประกอบ / ภาพตัวอย่างสิ่งของ (ถ้ามี)
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">อัปโหลดรูปภาพตัวอย่างสิ่งของ</label>
            <input @change="handleFileUpload" type="file" accept="image/*"
              class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer" />
            
            <!-- ภาพพรีวิว -->
            <div v-if="previewUrl" class="mt-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center shadow-inner max-w-sm">
              <img :src="previewUrl" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="pt-6 flex gap-3 border-t border-slate-100">
          <button type="button" @click="$emit('close')" 
            class="w-1/3 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 text-sm transition duration-150">
            ยกเลิก
          </button>
          <button type="submit" :disabled="isSubmitting" 
            class="w-2/3 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition duration-150 flex items-center justify-center disabled:opacity-50 shadow-md">
            <span v-if="isSubmitting" class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            {{ isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ลงทะเบียนของหาย' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  show: Boolean,
  isSubmitting: Boolean,
  username: {
    type: String,
    default: 'Staff'
  }
})

const emit = defineEmits(['close', 'submit'])

const categories = ['Electronics', 'Documents', 'Clothing', 'Accessories', 'Other']

const form = ref({
  name: '',
  category: '',
  place: '',
  date: '',
  description: '',
  status: 'lost', // Hardcoded as lost
  locker: '',     // No locker for lost items
  finder_type: 'student',
  finder_phoneNumber: '',
  finder_studentId: '',
  finder_universityEmail: '',
  namereport: props.username,
  staffName: props.username
})

const imageFile = ref(null)
const previewUrl = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = {
      name: '',
      category: '',
      place: '',
      date: dayjs().format('YYYY-MM-DDTHH:mm'),
      description: '',
      status: 'lost',
      locker: '',
      finder_type: 'student',
      finder_phoneNumber: '',
      finder_studentId: '',
      finder_universityEmail: '',
      namereport: props.username,
      staffName: props.username
    }
    imageFile.value = null
    previewUrl.value = ''
  }
})

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  imageFile.value = file
  if (file) {
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = ''
  }
}

const submitForm = () => {
  emit('submit', form.value, imageFile.value)
}
</script>
