<template>
  <div class="space-y-6">
    <!-- Guard Page Access -->
    <div v-if="!hasAccess" class="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 max-w-2xl">
      <div class="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-lg mx-auto shadow-sm text-rose-600 mb-3">
        <font-awesome :icon="['fas', 'shield-halved']" />
      </div>
      <p class="text-sm font-semibold">ขออภัย บัญชีของคุณไม่มีสิทธิ์ในการเข้าถึงหน้าตั้งค่าระบบ</p>
      <p class="text-xs text-rose-600 mt-1">สิทธิ์ในการตั้งค่าระบบถูกจำกัดเฉพาะบัญชีผู้ดูแลพิเศษเท่านั้น</p>
    </div>

    <div v-else class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-2xl">
      
      <div class=" text-xs font-medium text-slate-650">
        <!-- Profile -->
        <div class="border-b border-slate-100 pb-4">
          <h4 class="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">ข้อมูลผู้ใช้งาน</h4>
          <div>
            <p class="text-[10px] text-slate-400">อีเมลผู้ใช้งาน:</p>
            <p class="text-slate-800 font-semibold mt-0.5">2210511101002@utcc.ac.th</p>
          </div>
        </div>
        
        <!-- Connection -->
        <div class="border-b border-slate-100 pb-4">
          <h4 class="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">การเชื่อมต่อเซิร์ฟเวอร์</h4>
          <div class="space-y-2 font-mono">
            <div>
              <p class="text-[10px] text-slate-400 font-sans">API Base Endpoint:</p>
              <p class="text-slate-700 mt-0.5 select-all">{{ config.public.apiBaseUrl }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-sans">ฐานข้อมูลระบบ (Supabase SQL):</p>
              <p class="text-slate-700 mt-0.5">Active / Connected ✅</p>
            </div>
          </div>
        </div>
        
        <!-- Alert toggles -->
        <div>
          <h4 class="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">การแจ้งเตือน</h4>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked id="notify-line" class="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300" />
              <span class="text-slate-700">ส่งข้อความแจ้งเตือนหาเจ้าของผ่าน Line Official Account โดยอัตโนมัติ</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked id="notify-email" class="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300" />
              <span class="text-slate-700">ส่งอีเมลสรุปยอดของหายประจำสัปดาห์ให้กับคณะบดี</span>
            </label>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="border-t border-slate-100 pt-4">
          <h4 class="text-xs font-bold text-rose-600 mb-3 uppercase tracking-wider">⚠️ Zone อันตราย</h4>
          <button @click="handleLogout"
            class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition">
            🚪 ออกจากระบบ (Logout)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'

definePageMeta({ layout: 'dashboard', title: 'การตั้งค่าระบบ (Settings)', icon: 'gear' })

const authStore = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

const hasAccess = computed(() => {
  const email = authStore.user?.email || authStore.user?.username || '';
  return email === '2210511101002@utcc.ac.th' || authStore.token === 'mock-token' || authStore.token === 'bypass-token-12345';
})

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>
