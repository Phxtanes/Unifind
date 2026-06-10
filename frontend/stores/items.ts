import { defineStore } from 'pinia'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'

const MOCK_ITEMS = [
  {
    id: 1,
    name: 'กระเป๋าสตางค์หนังสีน้ำตาล',
    category: 'Accessories',
    place: 'ห้องน้ำชั้น 2 อาคาร 24',
    date: new Date().toISOString(),
    description: 'กระเป๋าหนังผู้ชาย มีบัตรนักศึกษา UTCC ข้างใน',
    status: 'stored',
    locker: 'ล็อกเกอร์ ที่ - 1',
    image_url: null,
    staffName: 'BypassAdmin'
  },
  {
    id: 2,
    name: 'iPad Pro พร้อม Apple Pencil',
    category: 'Electronics',
    place: 'โรงอาหารกลาง มหาวิทยาลัยหอการค้าไทย',
    date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    description: 'ไอแพดมีเคสสีเขียวพาสเทล ลืมวางไว้ที่โรงอาหารหลัก',
    status: 'stored',
    locker: 'ล็อกเกอร์ ที่ - 5',
    image_url: null,
    staffName: 'BypassAdmin'
  },
  {
    id: 3,
    name: 'กุญแจรถยนต์ Toyota',
    category: 'Accessories',
    place: 'ลานจอดรถชั้น B1',
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    description: 'กุญแจมีพวงกุญแจรูปตุ๊กตาหมี',
    status: 'lost',
    locker: null,
    image_url: null,
    staffName: 'BypassAdmin'
  },
  {
    id: 4,
    name: 'หนังสือ Introduction to Economics',
    category: 'Documents',
    place: 'ห้องสมุดชั้น 3 อาคาร 1',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    description: 'หนังสือปกแข็งสีน้ำเงิน มีชื่อเจ้าของเขียนไว้ด้านใน',
    status: 'claimed',
    locker: null,
    image_url: null,
    staffName: 'BypassAdmin'
  },
  {
    id: 5,
    name: 'โทรศัพท์มือถือ iPhone 15',
    category: 'Electronics',
    place: 'ห้องเรียน 24-301',
    date: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
    description: 'iPhone สีดำ มีเคสใสติดสติ๊กเกอร์',
    status: 'stored',
    locker: 'ล็อกเกอร์ ที่ - 3',
    image_url: null,
    staffName: 'BypassAdmin'
  }
]

export const useItemsStore = defineStore('items', {
  state: () => ({
    items: [] as any[],
    loading: false,
    lastUpdated: null as Date | null,
  }),
  actions: {
    async fetchItems() {
      this.loading = true
      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      try {
        const response = await axios.get(`${config.public.apiBaseUrl}/lost-items`, {
          params: { page: 1, limit: 1000 }
        })
        if (response.data && response.data.items) {
          this.items = response.data.items
        } else if (response.data && Array.isArray(response.data)) {
          this.items = response.data
        } else {
          this.items = []
        }
        this.lastUpdated = new Date()
      } catch (error) {
        console.error('Error fetching items:', error)
        // Use mock data for bypass/dev mode
        if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
          this.items = [...MOCK_ITEMS]
        }
      } finally {
        this.loading = false
      }
    }
  },
  getters: {
    countByStatus: (state) => (status: string) => {
      return state.items.filter(item => {
        if (status === 'found') return item.status === 'found' || item.status === 'stored'
        if (status === 'claimed') return item.status === 'claimed' || item.status === 'removed'
        return item.status === status
      }).length
    },
    countExpired: (state) => {
      const now = new Date()
      return state.items.filter(item => {
        const diff = (now.getTime() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24)
        return (item.status === 'stored' || item.status === 'found') && diff > 30
      }).length
    }
  }
})
