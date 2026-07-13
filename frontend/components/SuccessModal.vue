<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60  animate-fade-in">
    <div class="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 animate-scale-up">
      <!-- Success Icon -->
      <div class="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500 text-3xl mx-auto shadow-sm mb-4 animate-bounce">
        <font-awesome :icon="['fas', 'circle-check']" />
      </div>
      
      <!-- Title & Message -->
      <h3 class="text-base font-black text-slate-800 tracking-tight">{{ title }}</h3>
      <p class="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
        {{ message }}
      </p>

      <!-- Action Button -->
      <div class="mt-6">
        <button 
          @click="$emit('close')" 
          class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition duration-150 shadow-md cursor-pointer"
        >
          ตกลง
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'ดำเนินการสำเร็จ!'
  },
  message: {
    type: String,
    default: 'ระบบได้ทำรายการของคุณเสร็จสิ้นเรียบร้อยแล้ว'
  }
})

defineEmits(['close'])
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-scale-up {
  animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
