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
          <span class="contact-icon">📍</span>
          <span class="contact-text">126/1 ถนน วิภาวดีรังสิต Khwaeng Din Daeng, Khet Din Daeng</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon">📞</span>
          <span class="contact-text">02-697-6901</span>
        </div>
        <div class="contact-item">
          <span class="contact-icon">📧</span>
          <span class="contact-text">student_dev@utcc.ac.th</span>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="login-container">
        <h2 class="login-title font-bold">ระบบบันทึกของหาย<br><span class="text-sm text-slate-500 font-normal">(สำหรับเจ้าหน้าที่จัดการข้อมูล)</span></h2>
        <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>
        
        <form class="login-form" @submit.prevent="handleLogin">
          <input v-model="loginData.username" type="text" class="login-input" placeholder="ชื่อผู้ใช้เจ้าหน้าที่" required
            :disabled="loading" />
          <input v-model="loginData.password" type="password" class="login-input" placeholder="รหัสผ่าน" required
            :disabled="loading" />
          
          <button type="submit" class="login-button font-semibold" :disabled="loading" :class="{ loading }">
            {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเจ้าหน้าที่' }}
          </button>

           <button type="button" class="bypass-button" @click="handleBypass">
            ⚡ Bypass Login (ทดสอบระบบ)
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'auth',
})

const auth = useAuthStore()

onMounted(() => {
  auth.initAuth()
  if (auth.isAuthenticated) {
    navigateTo('/dashboard')
  }
})

const loginData = reactive({ username: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)

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
</script>
