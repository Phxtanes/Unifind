<template>
  <aside class="w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between border-r border-slate-950 shrink-0 select-none">
    <div>
      <!-- Logo Area -->
      <div class="p-6 border-b border-slate-800/60 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-600/30">
          🛡️
        </div>
        <div>
          <h1 class="text-sm font-bold text-white tracking-tight leading-none">UTCC Unifind</h1>
          <p class="text-[10px] text-slate-400 font-medium mt-1">Lost &amp; Found Portal</p>
        </div>
      </div>
      
      <!-- Navigation Menu -->
      <nav class="p-4 space-y-1.5">
        <NuxtLink to="/dashboard" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-semibold"
          :exact="true"
          id="nav-dashboard">
          <span>🏠</span> หน้าหลัก
        </NuxtLink>
        <NuxtLink to="/items" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-semibold"
          id="nav-items">
          <span>📋</span> รายการทั้งหมด
        </NuxtLink>
        <NuxtLink to="/lost" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#F43F5E] font-semibold"
          id="nav-lost">
          <span>👜</span> ของหาย
        </NuxtLink>
        <NuxtLink to="/found" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold"
          id="nav-found">
          <span>🧩</span> พบของ
        </NuxtLink>
        <NuxtLink to="/claimed" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-semibold"
          id="nav-claimed">
          <span>🔄</span> คืนแล้ว
        </NuxtLink>
        <NuxtLink to="/lockers" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-semibold"
          id="nav-lockers">
          <span>🗄️</span> ตู้เก็บของ
        </NuxtLink>
        <NuxtLink to="/reports" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-semibold"
          id="nav-reports">
          <span>📊</span> รายงาน
        </NuxtLink>
        <!-- <NuxtLink to="/history" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-semibold"
          id="nav-history">
          <span>📜</span> ประวัติการดำเนินการ
        </NuxtLink> -->
        <!-- <NuxtLink to="/settings" 
          class="w-full px-4 py-2.5 rounded-xl text-left text-xs font-medium flex items-center gap-3 transition-all duration-150 border border-transparent hover:bg-slate-800/40 hover:text-white"
          active-class="bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-semibold"
          id="nav-settings">
          <span>⚙️</span> ตั้งค่า
        </NuxtLink> -->
      </nav>
    </div>
    
    <!-- User profile & Logout -->
    <div class="p-4 border-t border-slate-800/60 space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center font-bold text-white overflow-hidden shadow-inner">
          👤
        </div>
        <div>
          <h4 class="text-xs font-bold text-white truncate w-36">{{ username }}</h4>
          <p class="text-[10px] text-slate-400 font-medium">เจ้าหน้าที่ผู้ดูแล / Admin</p>
        </div>
      </div>
      <button @click="$emit('logout')" 
        class="w-full py-2 bg-slate-850 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 text-xs font-semibold rounded-xl border border-slate-800 hover:border-rose-900/50 transition duration-150">
        🚪 ออกจากระบบ
      </button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  username: {
    type: String,
    default: 'เจ้าหน้าที่'
  }
})

defineEmits(['logout'])
</script>
