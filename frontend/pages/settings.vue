<template>
  <div class="space-y-6">

    <div>
      <h2 class="text-lg font-bold text-slate-900">⚙️ การตั้งค่าระบบ (Settings)</h2>
      <p class="text-xs text-slate-400 mt-0.5">รายละเอียดผู้ใช้งานและการกำหนดค่าระบบสำหรับการเชื่อมต่อเซิร์ฟเวอร์</p>
    </div>

    <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-2xl">
      
      <div class="space-y-6 text-xs font-medium text-slate-650">
        <!-- Profile -->
        <div class="border-b border-slate-100 pb-4">
          <h4 class="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">ข้อมูลผู้ใช้งาน</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-[10px] text-slate-400">ชื่อเจ้าหน้าที่:</p>
              <p class="text-slate-800 font-semibold mt-0.5">{{ authStore.user?.username || 'Admin Staff' }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">บทบาทสิทธิ์การใช้งาน:</p>
              <p class="text-emerald-600 font-semibold mt-0.5">ผู้ดูแลระบบคลัง (System Staff)</p>
            </div>
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
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>
