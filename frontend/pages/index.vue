<template>
  <div class="main-container">
    <!-- Left Panel -->
    <div class="left-panel">
      <div>
        <div class="logo">
          <div class="logo-white-box"></div>
          <div class="logo-green-box"></div>
        </div>
        <div class="title-container">
          <p class="office-of">Office of</p>
          <p class="student">Student</p>
          <p class="development">Development</p>
          <p class="thai-text">สำนักกิจการนักศึกษา มหาวิทยาลัยหอการค้าไทย</p>
        </div>
      </div>
      <div class="contact-info">
        <div class="contact-item">
          <span class="contact-icon text-xs text-slate-400">
            <font-awesome :icon="['fas', 'location-dot']" />
          </span>
          <span class="contact-text">126/1 ถนน วิภาวดีรังสิต Khwaeng Din Daeng, Khet Din Daeng</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon text-xs text-slate-400">
            <font-awesome :icon="['fas', 'phone']" />
          </span>
          <span class="contact-text">02-697-6901</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon text-xs text-slate-400">
            <font-awesome :icon="['fas', 'envelope']" />
          </span>
          <span class="contact-text">student_dev@utcc.ac.th</span>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="login-container">
        <h2 class="login-title font-bold">
          {{ isRegistering ? 'สมัครสมาชิกเจ้าหน้าที่' : 'ระบบบันทึกของหาย' }}<br>
          <span class="text-sm text-slate-500 font-normal">({{ isRegistering ? 'ลงทะเบียนสิทธิ์เข้าใช้งาน' : 'สำหรับเจ้าหน้าที่จัดการข้อมูล' }})</span>
        </h2>
        <div v-if="errorMsg" class="error-message mb-4">{{ errorMsg }}</div>
        <div v-if="successMsg" class="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold text-center">
          {{ successMsg }}
        </div>
        
        <form v-if="!isRegistering" class="login-form" @submit.prevent="handleLogin">
          <input v-model="loginData.username" type="text" class="login-input" placeholder="ชื่อผู้ใช้เจ้าหน้าที่" required
            :disabled="loading" />
          <input v-model="loginData.password" type="password" class="login-input" placeholder="รหัสผ่าน" required
            :disabled="loading" />
          
          <button type="submit" class="login-button font-semibold mb-2" :disabled="loading" :class="{ loading }">
            {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเจ้าหน้าที่' }}
          </button>

          <button type="button" @click="handleBypass" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-sm mb-4">
            <font-awesome :icon="['fas', 'bolt']" class="text-amber-500" />
            เข้าใช้งานระบบแบบ Bypass (สำหรับทดสอบ)
          </button>

          <p class="text-xs text-center text-slate-500 font-semibold mt-2">
            ยังไม่มีบัญชีเจ้าหน้าที่? 
            <button type="button" @click="toggleMode" class="text-indigo-650 hover:text-indigo-850 font-bold ml-1 transition focus:outline-none">
              สมัครสมาชิกที่นี่
            </button>
          </p>
        </form>

        <form v-else class="login-form" @submit.prevent="handleRegister">
          <input v-model="registerData.username" type="text" class="login-input" placeholder="ชื่อผู้ใช้งาน (Username) *" required
            :disabled="loading" />
          <input v-model="registerData.email" type="email" class="login-input" placeholder="อีเมลติดต่อ (Email) *" required
            :disabled="loading" />
          <input v-model="registerData.password" type="password" class="login-input" placeholder="รหัสผ่าน (Password) *" required
            :disabled="loading" />
          <input v-model="registerData.confirmPassword" type="password" class="login-input" placeholder="ยืนยันรหัสผ่าน *" required
            :disabled="loading" />
          
          <button type="submit" class="login-button font-semibold mb-4 bg-emerald-600 hover:bg-emerald-700" :disabled="loading">
            {{ loading ? 'กำลังสมัครสมาชิก...' : 'ส่งคำขอสมัครสมาชิก' }}
          </button>

          <p class="text-xs text-center text-slate-500 font-semibold mt-2">
            มีบัญชีเจ้าหน้าที่อยู่แล้ว? 
            <button type="button" @click="toggleMode" class="text-indigo-650 hover:text-indigo-850 font-bold ml-1 transition focus:outline-none">
              เข้าสู่ระบบที่นี่
            </button>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: false,
})

const auth = useAuthStore()
const route = useRoute()

onMounted(() => {
  // บันทึก lineUserId หากมีแนบมาในลิงก์เว็บ
  const lineUserId = route.query.lineUserId as string
  if (lineUserId) {
    localStorage.setItem('pendingLineUserId', lineUserId)
    console.log('Saved pending lineUserId:', lineUserId)
  }

  auth.initAuth()
  if (auth.isAuthenticated) {
    navigateTo('/dashboard')
  }
})

const isRegistering = ref(false)
const loginData = reactive({ username: '', password: '' })
const registerData = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  errorMsg.value = ''
  successMsg.value = ''
}

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const result = await auth.login(loginData.username, loginData.password)
    if (result.success) {
      navigateTo('/dashboard')
    } else {
      errorMsg.value = result.message || 'เข้าสู่ระบบล้มเหลว'
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
  } finally {
    loading.value = false
  }
}

const handleBypass = () => {
  auth.bypassLogin()
  navigateTo('/dashboard')
}

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (registerData.password !== registerData.confirmPassword) {
    errorMsg.value = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน'
    return
  }

  loading.value = true
  try {
    const result = await auth.register(
      registerData.username,
      registerData.email,
      registerData.password,
      registerData.username // using username as full name
    )
    if (result.success) {
      successMsg.value = 'ส่งคำขอสมัครสมาชิกสำเร็จ! กรุณารอการอนุมัติสิทธิ์จากผู้ดูแลระบบ (Admin)'
      // Clear register form
      registerData.username = ''
      registerData.email = ''
      registerData.password = ''
      registerData.confirmPassword = ''
      // Switch back to login mode after short delay
      setTimeout(() => {
        isRegistering.value = false
      }, 5000)
    } else {
      errorMsg.value = result.message || 'สมัครสมาชิกไม่สำเร็จ'
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'เกิดข้อผิดพลาดในระบบ'
  } finally {
    loading.value = false
  }
}
</script>
