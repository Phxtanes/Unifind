<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900">จัดการผู้ใช้งานระบบ</h1>
        <p class="text-xs text-slate-500 font-medium">จัดการสิทธิ์เข้าใช้งาน บัญชีเจ้าหน้าที่ และตรวจสอบคำขอลงทะเบียนเข้าใช้งานระบบ</p>
      </div>
      <!-- Add User Button -->
      <button 
        v-if="isAdminUser"
        @click="showAddModal = true"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-200 shadow-sm self-start md:self-auto"
      >
        <font-awesome :icon="['fas', 'plus']" />
        เพิ่มผู้ใช้งานใหม่
      </button>
    </div>

    <!-- Non-Admin Authorization Guard -->
    <div v-if="!isAdminUser" class="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
      <div class="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-lg mx-auto shadow-sm text-rose-600 mb-3">
        <font-awesome :icon="['fas', 'shield-halved']" />
      </div>
      <p class="text-sm font-semibold">ขออภัย บัญชีของคุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการผู้ใช้</p>
      <p class="text-xs text-rose-600 mt-1">เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถจัดการบัญชีผู้ใช้ได้</p>
    </div>

    <div v-else class="space-y-6 animate-fade-in-up">
      <!-- Search and Tab Controls Card -->
      <div class="bg-white rounded-xl py-3 px-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Tabs selection -->
        <div class="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button 
            @click="activeTab = 'staff'"
            :class="[
              activeTab === 'staff' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            ]"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition duration-150 flex items-center gap-1.5"
          >
            <font-awesome :icon="['fas', 'user-shield']" />
            เจ้าหน้าที่ในระบบ ({{ staffUsers.length }})
          </button>
          <button 
            @click="activeTab = 'pending'"
            :class="[
              activeTab === 'pending' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            ]"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition duration-150 flex items-center gap-1.5"
          >
            <font-awesome :icon="['fas', 'user-clock']" />
            คำขออนุมัติสิทธิ์ ({{ pendingUsers.length }})
          </button>
        </div>

        <!-- Search Box -->
        <div class="relative w-full max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
            <font-awesome :icon="['fas', 'magnifying-glass']" />
          </span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="ค้นหาผู้ใช้..." 
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs text-slate-700 transition" 
          />
        </div>
      </div>

      <!-- Items Table Card (Active Staff) -->
      <div v-if="activeTab === 'staff'" class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[480px]">
        <div class="pt-6 mb-4">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">บัญชีเจ้าหน้าที่ (Active Staff & Admins)</h3>
        </div>
        
        <div class="overflow-x-auto -mx-6 flex-1">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/70">
                <th class="py-4 px-6">ชื่อผู้ใช้งาน (Username)</th>
                <th class="py-4 px-6">อีเมล (Email)</th>
                <th class="py-4 px-6">ระดับสิทธิ์ (Role)</th>
                <th class="py-4 px-6">สถานะ (Status)</th>
                <th class="py-4 px-6">วันที่บันทึกระบบ</th>
                <th class="py-4 px-6 text-center">จัดการบัญชี</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
              <tr v-for="user in filteredStaff" :key="user.user_id" class="hover:bg-indigo-50/30 transition-all duration-150">
                <td class="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {{ user.username.slice(0, 2).toUpperCase() }}
                  </span>
                  {{ user.username }}
                </td>
                <td class="py-4 px-6 text-slate-500 font-medium">{{ user.email }}</td>
                <td class="py-4 px-6">
                  <span 
                    :class="[
                      user.role === 'ADMIN' || user.role === 'admin' 
                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    ]"
                    class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span 
                    :class="[
                      user.status === 'Active' || user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    ]"
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase"
                  >
                    <span 
                      :class="user.status === 'Active' || user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'" 
                      class="w-1.5 h-1.5 rounded-full"
                    ></span>
                    {{ user.status === 'Active' || user.status === 'active' ? 'พร้อมใช้งาน' : 'ระงับชั่วคราว' }}
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-455 font-medium font-mono">{{ formatFullDate(user.created_at || user.createdAt) }}</td>
                <td class="py-4 px-6">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      v-if="user.status === 'Active' || user.status === 'active'"
                      @click="deactivateUserAccount(user.user_id)"
                      class="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200 transition"
                      title="ระงับการใช้งาน"
                    >
                      <font-awesome :icon="['fas', 'user-slash']" class="mr-1" />
                      ระงับ
                    </button>
                    <button 
                      v-else
                      @click="activateUserAccount(user.user_id)"
                      class="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 transition"
                      title="เปิดใช้งาน"
                    >
                      <font-awesome :icon="['fas', 'user-check']" class="mr-1" />
                      เปิดใช้
                    </button>
                    <button 
                      @click="deleteUserAccount(user.user_id)" 
                      class="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100/50 transition"
                      title="ลบบัญชีอย่างถาวร"
                    >
                      <font-awesome :icon="['fas', 'trash-can']" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredStaff.length === 0">
                <td colspan="6" class="py-20 text-center text-slate-400 font-medium">ไม่พบบัญชีเจ้าหน้าที่ในระบบ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Items Table Card (Pending Requests) -->
      <div v-else class="bg-white pt-0 px-6 pb-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[480px]">
        <div class="pt-6 mb-4">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">คำขอลงทะเบียนเข้าใช้งานใหม่ (Pending Registration)</h3>
        </div>

        <div class="overflow-x-auto -mx-6 flex-1">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/70">
                <th class="py-4 px-6">ชื่อผู้สมัคร (Username)</th>
                <th class="py-4 px-6">อีเมลติดต่อ (Email)</th>
                <th class="py-4 px-6">ระดับสิทธิ์ที่ขอ</th>
                <th class="py-4 px-6">สถานะดำเนินการ</th>
                <th class="py-4 px-6">วันที่สมัคร</th>
                <th class="py-4 px-6 text-center">การอนุมัติ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
              <tr v-for="user in filteredPending" :key="user.user_id" class="hover:bg-indigo-50/30 transition-all duration-150">
                <td class="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {{ user.username.slice(0, 2).toUpperCase() }}
                  </span>
                  {{ user.username }}
                </td>
                <td class="py-4 px-6 text-slate-500 font-medium">{{ user.email }}</td>
                <td class="py-4 px-6">
                  <span class="bg-amber-50 text-amber-700 border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold border uppercase">
                    MEMBER -> STAFF
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold rounded-full uppercase">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    รออนุมัติสิทธิ์
                  </span>
                </td>
                <td class="py-4 px-6 text-slate-455 font-medium font-mono">{{ formatFullDate(user.created_at || user.createdAt) }}</td>
                <td class="py-4 px-6 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      @click="approveRequest(user.user_id)"
                      class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shadow-sm"
                    >
                      <font-awesome :icon="['fas', 'circle-check']" class="mr-1" />
                      อนุมัติสิทธิ์
                    </button>
                    <button 
                      @click="rejectRequest(user.user_id)"
                      class="px-4 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 hover:border-rose-200 transition"
                    >
                      <font-awesome :icon="['fas', 'circle-xmark']" class="mr-1" />
                      ปฏิเสธ
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredPending.length === 0">
                <td colspan="6" class="py-20 text-center text-slate-400 font-medium">ไม่มีคำขอที่รอการอนุมัติสิทธิ์เข้าใช้งาน</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4" @click.self="showAddModal = false">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-w-md w-full animate-fade-in-up">
        <div class="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b border-slate-800">
          <h2 class="text-sm font-bold tracking-tight flex items-center gap-2">
            <font-awesome :icon="['fas', 'user-plus']" class="text-slate-400" />
            เพิ่มผู้ใช้งานใหม่
          </h2>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-white text-xl font-semibold outline-none">&times;</button>
        </div>

        <form @submit.prevent="createNewUser" class="p-6 space-y-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ชื่อผู้ใช้งาน (Username) *</label>
            <input 
              type="text" 
              v-model="newUserForm.username" 
              required
              placeholder="กรอกชื่อผู้ใช้งาน..."
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">อีเมลติดต่อ (Email) *</label>
            <input 
              type="email" 
              v-model="newUserForm.email" 
              required
              placeholder="example@unifind.local..."
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">รหัสผ่าน (Password) *</label>
            <input 
              type="password" 
              v-model="newUserForm.password" 
              required
              placeholder="กรอกรหัสผ่านเริ่มต้น..."
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ระดับสิทธิ์ (Role)</label>
              <select 
                v-model="newUserForm.role" 
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">สถานะเริ่มต้น</label>
              <select 
                v-model="newUserForm.status" 
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="Active">เปิดใช้งาน</option>
                <option value="Suspended">ระงับชั่วคราว</option>
              </select>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button 
              type="button"
              @click="showAddModal = false" 
              class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              :disabled="isSubmittingUser"
              class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50"
            >
              {{ isSubmittingUser ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'
import { useItemHelpers } from '~/composables/useItemHelpers'
import { useRuntimeConfig, useRouter } from '#app'

definePageMeta({ layout: 'dashboard', title: 'จัดการผู้ใช้', icon: 'users' })

const authStore = useAuthStore()
const { formatFullDate } = useItemHelpers()
const router = useRouter()

// Check Authorization role
const isAdminUser = computed(() => {
  return authStore.user?.role?.toLowerCase() === 'admin'
})

// Active components state
const activeTab = ref('staff')
const searchQuery = ref('')
const staffUsers = ref<any[]>([])
const pendingUsers = ref<any[]>([])

// Modal States
const showAddModal = ref(false)
const isSubmittingUser = ref(false)
const newUserForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'STAFF',
  status: 'Active'
})

// Fetch all users list
const fetchUsersData = async () => {
  const config = useRuntimeConfig()
  


  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    const [staffRes, pendingRes] = await Promise.all([
      axios.get(`${config.public.apiBaseUrl}/auth/users`, { headers }),
      axios.get(`${config.public.apiBaseUrl}/auth/users/pending`, { headers })
    ])
    staffUsers.value = staffRes.data || []
    pendingUsers.value = pendingRes.data || []
  } catch (error) {
    console.error('Failed to load user management tables:', error)
  }
}

onMounted(async () => {
  authStore.initAuth()
  if (isAdminUser.value) {
    await fetchUsersData()
  }
})

// Filters
const filteredStaff = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return staffUsers.value
  return staffUsers.value.filter(u => 
    u.username.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query)
  )
})

const filteredPending = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return pendingUsers.value
  return pendingUsers.value.filter(u => 
    u.username.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query)
  )
})

// Add User Action
const createNewUser = async () => {
  if (!newUserForm.value.username || !newUserForm.value.email || !newUserForm.value.password) {
    alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
    return
  }

  isSubmittingUser.value = true
  const config = useRuntimeConfig()



  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    await axios.post(`${config.public.apiBaseUrl}/auth/users`, newUserForm.value, { headers })
    await fetchUsersData()
    showAddModal.value = false
    newUserForm.value = { username: '', email: '', password: '', role: 'STAFF', status: 'Active' }
  } catch (error: any) {
    console.error('Failed to create user:', error)
    alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้')
  } finally {
    isSubmittingUser.value = false
  }
}

// Actions
const activateUserAccount = async (userId: number) => {
  const config = useRuntimeConfig()


  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    await axios.put(`${config.public.apiBaseUrl}/auth/user/${userId}/activate`, {}, { headers })
    await fetchUsersData()
  } catch (error) {
    console.error('Activate error:', error)
    alert('เกิดข้อผิดพลาดในการเปิดใช้งานบัญชี')
  }
}

const deactivateUserAccount = async (userId: number) => {
  const config = useRuntimeConfig()
  
  // Guard admin account deactivation
  const userToEdit = staffUsers.value.find(user => user.user_id === userId)
  if (userToEdit && userToEdit.username === 'admin') {
    alert('ไม่สามารถระงับสิทธิ์บัญชี Admin หลักได้')
    return
  }



  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    await axios.put(`${config.public.apiBaseUrl}/auth/user/${userId}/deactivate`, {}, { headers })
    await fetchUsersData()
  } catch (error) {
    console.error('Deactivate error:', error)
    alert('เกิดข้อผิดพลาดในการระงับบัญชีผู้ใช้')
  }
}

const deleteUserAccount = async (userId: number) => {
  const config = useRuntimeConfig()
  const userToEdit = staffUsers.value.find(user => user.user_id === userId)
  if (userToEdit && userToEdit.username === 'admin') {
    alert('ไม่สามารถลบบัญชี Admin หลักได้')
    return
  }

  if (!confirm('คุณแน่ใจว่าต้องการลบบัญชีผู้ใช้งานนี้ออกจากระบบอย่างถาวร?')) return



  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    await axios.delete(`${config.public.apiBaseUrl}/auth/user/${userId}`, { headers })
    await fetchUsersData()
  } catch (error) {
    console.error('Delete user error:', error)
    alert('เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้งาน')
  }
}

const approveRequest = async (userId: number) => {
  const config = useRuntimeConfig()


  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    await axios.put(`${config.public.apiBaseUrl}/auth/user/${userId}/approve`, {}, { headers })
    await fetchUsersData()
  } catch (error) {
    console.error('Approve error:', error)
    alert('เกิดข้อผิดพลาดในการอนุมัติบัญชีผู้ใช้')
  }
}

const rejectRequest = async (userId: number) => {
  const config = useRuntimeConfig()
  if (!confirm('คุณแน่ใจว่าต้องการปฏิเสธคำขอนี้? ข้อมูลบัญชีจะถูกลบออกจากคิวการรับสมัคร')) return



  try {
    const headers = { Authorization: `Bearer ${authStore.token}` }
    await axios.delete(`${config.public.apiBaseUrl}/auth/user/${userId}/reject`, { headers })
    await fetchUsersData()
  } catch (error) {
    console.error('Reject error:', error)
    alert('เกิดข้อผิดพลาดในการปฏิเสธการลงทะเบียน')
  }
}
</script>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
