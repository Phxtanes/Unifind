<template>
  <!-- Desktop Sidebar -->
  <aside :class="[
    'bg-white border-r border-slate-200/80 flex-shrink-0 flex flex-col justify-between hidden lg:flex h-screen sticky top-0 transition-all duration-300 ease-in-out z-[45] select-none relative',
    isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
  ]">
    <!-- Toggle Button (Absolute Edge) -->
    <button @click="toggleSidebar"
      class="absolute top-5 -right-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-brand-500/50 text-slate-400 hover:text-brand-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md transition-all duration-200 z-50 cursor-pointer hover:scale-110 active:scale-95"
      :class="isSidebarCollapsed ? 'rotate-180' : ''">
      <font-awesome :icon="['fas', 'chevron-left']" class="text-[10px]" />
    </button>

    <!-- Logo Header -->
    <div class="h-16 px-5 flex items-center border-b border-slate-100 shrink-0 overflow-hidden justify-start">
      <div class="flex items-center cursor-pointer min-h-[36px]" @click="isSidebarCollapsed && toggleSidebar()">
        <!-- Glowing Symbol -->
        <div
          class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0 transition-transform duration-300 hover:scale-105">
          <font-awesome :icon="['fas', 'shield-halved']" class="text-white text-sm" />
        </div>
        <!-- Logo Text -->
        <span
          class="font-extrabold text-sm tracking-tight text-slate-800 truncate transition-all duration-300 origin-left overflow-hidden ml-3"
          :class="isSidebarCollapsed ? 'opacity-0 w-0 scale-x-0 ml-0' : 'opacity-100 w-auto scale-x-100'">
          UTCC Unifind
        </span>
      </div>
    </div>

    <!-- Navigation Menu List -->
    <div class="px-3 py-6 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin">
      <nav class="flex flex-col space-y-1.5 flex-1">
        <NuxtLink v-for="item in menuItems" :key="item.title" :to="item.path"
          class="group relative text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all duration-200"
          :class="[
            currentPath === item.path
              ? 'text-brand-600 bg-brand-50/50 font-bold before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-brand-600 before:rounded-r-md'
              : ''
          ]" :title="isSidebarCollapsed ? item.title : ''">
          <font-awesome :icon="['fas', item.icon]"
            class="text-sm w-5 text-center flex-shrink-0 transition-colors duration-300"
            :class="currentPath === item.path ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-700'" />
          <span class="truncate whitespace-nowrap transition-all duration-300 origin-left"
            :class="isSidebarCollapsed ? 'opacity-0 w-0 scale-x-0' : 'opacity-100 w-auto scale-x-100'">
            {{ item.title }}
          </span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Sidebar Footer -->
    <div class="p-4 border-t border-slate-100 flex flex-col items-center gap-3 bg-slate-50/50 shrink-0">
      <!-- <div v-if="!isSidebarCollapsed" class="flex items-center gap-3 w-full">
        <div class="w-8 h-8 rounded-full bg-slate-200 border border-slate-350 flex items-center justify-center font-bold text-slate-700 overflow-hidden shadow-inner">
          <font-awesome :icon="['fas', 'user']" class="text-slate-500 text-xs" />
        </div>
        <div class="truncate">
          <h4 class="text-[11px] font-bold text-slate-800 truncate w-32">{{ authStore.user?.username || 'เจ้าหน้าที่' }}</h4>
          <p class="text-[9px] text-slate-450">Admin Portal</p>
        </div>
      </div>
      <button @click="logout"
        class="w-full py-2 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold rounded-xl border border-slate-200 hover:border-rose-200 shadow-sm transition duration-150 flex items-center justify-center"
        :class="isSidebarCollapsed ? 'px-0' : 'px-4 gap-2'">
        <font-awesome :icon="['fas', 'right-from-bracket']" class="text-xs" />
        <span v-if="!isSidebarCollapsed">ออกจากระบบ</span>
      </button> -->
    </div>
  </aside>

  <!-- Mobile Topbar -->
  <div
    class="lg:hidden w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-[45] shrink-0 select-none">
    <!-- Logo Header (Mobile) -->
    <NuxtLink to="/dashboard" @click="isMobileOpen = false" class="flex items-center cursor-pointer min-h-[36px]">
      <div class="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-md shrink-0">
        <font-awesome :icon="['fas', 'shield-halved']" class="text-white text-xs" />
      </div>
      <span class="ml-2 font-extrabold text-sm tracking-tight text-slate-850">
        UTCC Unifind
      </span>
    </NuxtLink>

    <div class="flex items-center gap-2">
      <!-- Toggle Button (Mobile Menu) -->
      <button @click="isMobileOpen = !isMobileOpen"
        class="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg w-10 h-10 flex items-center justify-center transition-all duration-200 cursor-pointer">
        <font-awesome :icon="['fas', 'bars']" class="text-sm" />
      </button>
    </div>
  </div>

  <!-- Mobile Sidebar Drawer -->
  <div v-if="isMobileOpen" class="lg:hidden fixed inset-0 z-[99] flex">
    <!-- Backdrop Overlay -->
    <div class="fixed inset-0 bg-black/60 transition-opacity duration-300" @click="isMobileOpen = false"></div>

    <!-- Drawer Content -->
    <aside
      class="relative flex flex-col w-[280px] h-full bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out z-10 select-none text-slate-650">
      <!-- Header inside mobile drawer -->
      <div class="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <NuxtLink to="/dashboard" @click="isMobileOpen = false" class="flex items-center">
          <div class="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-md">
            <font-awesome :icon="['fas', 'shield-halved']" class="text-white text-xs" />
          </div>
          <span class="ml-2 font-extrabold text-sm tracking-tight text-slate-800">
            UTCC Unifind
          </span>
        </NuxtLink>
        <!-- Close Button -->
        <button @click="isMobileOpen = false"
          class="text-slate-400 hover:text-slate-600 rounded-lg w-8 h-8 flex items-center justify-center transition-colors duration-200 cursor-pointer">
          <font-awesome :icon="['fas', 'xmark']" class="text-sm" />
        </button>
      </div>

      <!-- Navigation Menu List (Mobile) -->
      <div class="px-3 py-4 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin">
        <nav class="flex flex-col space-y-1.5 flex-1">
          <NuxtLink v-for="item in menuItems" :key="item.title" :to="item.path" @click="isMobileOpen = false"
            class="group relative text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3.5 transition-all duration-300"
            :class="[
              currentPath === item.path
                ? 'text-brand-600 bg-brand-50/50 font-bold before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-brand-600 before:rounded-r-md'
                : ''
            ]">
            <font-awesome :icon="['fas', item.icon]"
              class="text-sm w-5 text-center flex-shrink-0 transition-colors duration-300"
              :class="currentPath === item.path ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-700'" />
            <span class="truncate">
              {{ item.title }}
            </span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Mobile Sidebar Footer -->
      <div class="p-4 border-t border-slate-100 flex flex-col items-center gap-3 bg-slate-50/50 shrink-0">
        <button @click="logout"
          class="w-full py-2.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold rounded-xl border border-slate-200 hover:border-rose-200 shadow-sm transition duration-150 flex items-center justify-center gap-2">
          <font-awesome :icon="['fas', 'right-from-bracket']" class="text-xs" />
          <span>{{ langStore.t('nav.logout') }}</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter } from 'vue-router';
import { useLangStore } from '~/stores/lang';

const authStore = useAuthStore();
const langStore = useLangStore();
const router = useRouter();

const currentPath = ref('');
const isMobileOpen = ref(false);

const isSidebarCollapsed = ref(false);

onMounted(() => {
  if (process.client) {
    isSidebarCollapsed.value = localStorage.getItem('sidebar') === 'collapsed';
  }
});

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  if (process.client) {
    localStorage.setItem('sidebar', isSidebarCollapsed.value ? 'collapsed' : 'expanded');
  }
};

const logout = () => {
  authStore.logout();
  router.push('/');
};

const menuItems = computed(() => {
  const items = [
    {
      title: langStore.t('หน้าหลัก'),
      path: '/dashboard',
      icon: 'house'
    },
    {
      title: langStore.t('รายการทั้งหมด'),
      path: '/items',
      icon: 'clipboard-list'
    },
    {
      title: langStore.t('ของหาย'),
      path: '/lost',
      icon: 'briefcase'
    },
    {
      title: langStore.t('พบของ'),
      path: '/found',
      icon: 'box-open'
    },
    {
      title: langStore.t('คืนแล้ว'),
      path: '/claimed',
      icon: 'rotate'
    },
    {
      title: langStore.t('ตู้เก็บของ'),
      path: '/lockers',
      icon: 'database'
    },
    {
      title: langStore.t('รายงาน'),
      path: '/reports',
      icon: 'chart-pie'
    },
    {
      title: langStore.t('วิเคราะห์จับคู่'),
      path: '/matching',
      icon: 'robot'
    },
    {
      title: langStore.t('ประวัติการดำเนินการ'),
      path: '/history',
      icon: 'clock-rotate-left'
    }
  ];

  if (authStore.user?.role?.toLowerCase() === 'admin') {
    items.push({
      title: langStore.t('จัดการผู้ใช้'),
      path: '/users',
      icon: 'users'
    });
  }

  /* const userEmail = authStore.user?.email || authStore.user?.username || '';
  if (userEmail === '2210511101002@utcc.ac.th' || authStore.token === 'mock-token' || authStore.token === 'bypass-token-12345') {
    items.push({
      title: langStore.t('การตั้งค่าระบบ'),
      path: '/settings',
      icon: 'gear'
    });
  } */

  return items;
});

watch(
  router.currentRoute,
  (newRoute) => {
    currentPath.value = newRoute.fullPath;
    isMobileOpen.value = false;
  },
  { immediate: true }
);
</script>

<style scoped>
/* Scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
