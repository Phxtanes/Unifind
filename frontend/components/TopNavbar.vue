<template>
  <!-- TOP NAVBAR -->
  <nav :class="['h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 bg-white/90 shrink-0', noMargin ? '' : '-mx-4 -mt-4 mb-6']">
    <div class="flex items-center gap-3">
      <div v-if="icon" class="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
        <font-awesome :icon="['fas', icon]" class="text-xs" />
      </div>
      <h1 class="text-base font-bold text-slate-800 tracking-tight">
        {{ title }}
      </h1>
      <slot name="title-suffix"></slot>
    </div>
    <div class="flex items-center gap-2">
      <slot></slot>

      <!-- Divider -->
      <div v-if="username" class="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

      <!-- User Profile Card -->
      <div v-if="username" class="flex items-center gap-3 pr-1 pl-3 py-1 rounded-full hover:bg-slate-50 transition-colors select-none">
        <!-- Info -->
        <div class="hidden sm:flex flex-col text-right">
          <span class="text-slate-700 text-xs font-semibold leading-tight">
            {{ username }}
          </span>
          <span class="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-brand-500">
            {{ authStore.user?.role || 'Admin' }}
          </span>
        </div>
        <!-- Avatar with initials -->
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-sm"
             :title="username">
          {{ getUserInitials(username) }}
        </div>
      </div>

      <!-- Divider -->
      <div v-if="username" class="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

      <!-- Logout Button -->
      <button v-if="username" @click="logout"
        class="flex items-center justify-center w-9 h-9 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Logout">
        <font-awesome :icon="['fas', 'right-from-bracket']" class="text-sm" />
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';

defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  noMargin: {
    type: Boolean,
    default: false
  }
});

const authStore = useAuthStore();
const router = useRouter();
const username = computed(() => authStore.user?.username);

const logout = () => {
  authStore.logout();
  router.push('/');
};

const getUserInitials = (name) => {
  if (!name) return '??';
  return name.slice(0, 2).toUpperCase();
};
</script>
