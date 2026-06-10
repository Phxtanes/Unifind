<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-w-2xl w-full transition-all duration-300 transform scale-100">
      
      <!-- Header -->
      <div class="bg-slate-800 px-8 py-5 flex justify-between items-center text-white">
        <div>
          <h2 class="text-lg font-bold tracking-tight flex items-center gap-2 text-slate-100">
            <span>📋</span> แจ้งนำสิ่งของเข้าคลังระบบ
          </h2>
          <p class="text-slate-400 text-xs mt-0.5">
            เจ้าหน้าที่ผู้รับแจ้ง: <span class="font-semibold text-slate-200">{{ username || 'ไม่ระบุ' }}</span>
          </p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white text-2xl font-normal outline-none transition duration-150">&times;</button>
      </div>
      
      <!-- Form -->
      <form @submit.prevent="submitForm" class="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
        
        <!-- Status Toggle -->
        <!-- <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ประเภทสถานะสิ่งของ</label>
          <div class="grid grid-cols-2 gap-4">
            <label :class="{'bg-slate-900 border-slate-950 text-white shadow-sm': form.status === 'stored', 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100': form.status !== 'stored'}" 
              class="cursor-pointer border rounded-xl p-3 flex items-center justify-center transition-all duration-150">
              <input type="radio" v-model="form.status" value="stored" class="sr-only">
              <span class="font-semibold text-sm">🔴 ตามหาเจ้าของ (Lost / Stored)</span>
            </label>
            <label :class="{'bg-slate-900 border-slate-950 text-white shadow-sm': form.status === 'removed', 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100': form.status !== 'removed'}" 
              class="cursor-pointer border rounded-xl p-3 flex items-center justify-center transition-all duration-150">
              <input type="radio" v-model="form.status" value="removed" class="sr-only">
              <span class="font-semibold text-sm">🟢 คืนเจ้าของแล้ว (Claimed)</span>
            </label>
          </div>
        </div> -->

        <!-- Section 1: ข้อมูลสิ่งของ -->
        <div class="space-y-4">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-900"></span> ข้อมูลรายละเอียดสิ่งของ
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
              <label class="block text-xs font-semibold text-slate-600 mb-1">สถานที่พบ <span class="text-red-500">*</span></label>
              <input v-model="form.place" type="text" required placeholder="เช่น ห้องเรียน 2434 ชั้น 3"
                class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">วันที่พบ <span class="text-red-500">*</span></label>
              <input v-model="form.date" type="datetime-local" required
                class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition text-slate-700" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">รายละเอียดเพิ่มเติม / ตำหนิพิเศษ</label>
            <textarea v-model="form.description" rows="2" placeholder="ระบุตำหนิ สี สติกเกอร์ หรือจุดสังเกตเฉพาะ..."
              class="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:border-slate-800 focus:ring-0 outline-none text-sm transition"></textarea>
          </div>
        </div>

        <!-- Section 2: ข้อมูลผู้พบสิ่งของ -->
        <div class="space-y-4 pt-2">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-900"></span> ข้อมูลรายละเอียดผู้พบส่ง
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">ประเภทสถานะผู้พบ <span class="text-red-500">*</span></label>
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

        <!-- Section 3: ข้อมูลเพิ่มเติม -->
        <div class="space-y-4 pt-2">
          <div class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-900"></span> ข้อมูลการจัดเก็บและรูปภาพ
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- อัปโหลดภาพ + พรีวิว -->
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-2">อัปโหลดรูปภาพสิ่งของ <span class="text-red-500">*</span></label>
              <input @change="handleCreateFileUpload" type="file" accept="image/*" required
                class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer" />
              
              <!-- ภาพพรีวิว -->
              <div v-if="previewUrl" class="mt-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center shadow-inner">
                <img :src="previewUrl" class="w-full h-full object-cover" />
              </div>
            </div>

            <!-- กล่องล็อกเกอร์ / QR Code -->
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">ระบุตู้ล็อกเกอร์ที่จัดเก็บ</label>
                <input v-model="form.locker" type="text" readonly 
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl outline-none text-sm font-medium cursor-not-allowed" />
                <p class="text-[10px] text-slate-400 mt-1">
                  (บันทึกในรอบบัญชีเดือน: {{ currentMonthName }})
                </p>
              </div>

              <!-- <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">รหัสติดตามสิ่งของ (QR Code)</label>
                <div class="border border-dashed border-slate-250 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center justify-center text-center min-h-[110px]">
                  <span class="text-xs text-slate-400 leading-relaxed font-medium">รหัสติดตาม QR Code<br>จะสร้างสำเร็จหลังจากการบันทึกรายการ</span>
                </div>
              </div> -->
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
            class="w-2/3 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition duration-150 flex items-center justify-center disabled:opacity-50 shadow-md">
            <span v-if="isSubmitting" class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            {{ isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันและนำสิ่งของเข้าคลัง' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
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

// หมวดหมู่สิ่งของ
const categories = ['Electronics', 'Documents', 'Clothing', 'Accessories', 'Other']

const form = ref({
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
  namereport: props.username,
  staffName: props.username
})

const imageFile = ref(null)
const previewUrl = ref('')

const currentMonthName = computed(() => {
  return new Date().toLocaleDateString('th-TH', { month: 'long' })
})

// กำหนดเลขตู้ตามเดือนปัจจุบัน (1-12)
const getCurrentLockerNum = () => {
  const currentMonth = new Date().getMonth() + 1 // 1-12
  return `ล็อกเกอร์ ที่ - ${currentMonth}`
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = {
      name: '',
      category: '',
      place: '',
      date: dayjs().format('YYYY-MM-DDTHH:mm'),
      description: '',
      status: 'stored',
      locker: getCurrentLockerNum(),
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

const handleCreateFileUpload = (event) => {
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
