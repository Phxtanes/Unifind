import { defineStore } from 'pinia'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'

const MOCK_CATEGORIES = [
  { category_id: 1, category_name: 'เอกสาร' },
  { category_id: 2, category_name: 'กระเป๋า' },
  { category_id: 3, category_name: 'โทรศัพท์' },
  { category_id: 4, category_name: 'กุญแจ' },
  { category_id: 5, category_name: 'เครื่องประดับ' }
]

const MOCK_LOCATIONS = [
  { location_id: 1, location_name: 'อาคาร 24' },
  { location_id: 2, location_name: 'อาคาร 6' },
  { location_id: 3, location_name: 'โรงอาหาร' },
  { location_id: 4, location_name: 'ห้องสมุด' }
]

const MOCK_LOCKERS = [
  { locker_id: 1, locker_code: 'L01', status: 'AVAILABLE' },
  { locker_id: 2, locker_code: 'L02', status: 'AVAILABLE' },
  { locker_id: 3, locker_code: 'L03', status: 'AVAILABLE' }
]

const MOCK_FOUND = [
  {
    found_item_id: 1,
    item_name: 'กระเป๋าสตางค์หนังสีน้ำตาล',
    categoryName: 'กระเป๋า',
    locationName: 'ห้องน้ำชั้น 2 อาคาร 24',
    found_date: new Date().toISOString(),
    description: 'กระเป๋าหนังผู้ชาย มีบัตรนักศึกษา UTCC ข้างใน',
    status: 'STORED',
    lockerCode: 'L01',
    image_url: 'https://images.unsplash.com/photo-1627124118123-e4d30009fe04?w=500',
    finderName: 'สมชาย รักดี',
    finderPhone: '081-234-5678'
  },
  {
    found_item_id: 2,
    item_name: 'iPad Pro พร้อม Apple Pencil',
    categoryName: 'โทรศัพท์',
    locationName: 'โรงอาหารกลาง มหาวิทยาลัยหอการค้าไทย',
    found_date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    description: 'ไอแพดมีเคสสีเขียวพาสเทล ลืมวางไว้ที่โรงอาหารหลัก',
    status: 'STORED',
    lockerCode: 'L02',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
    finderName: 'สมศรี รักเรียน',
    finderPhone: '082-345-6789'
  }
]

const MOCK_LOST = [
  {
    lost_item_id: 3,
    item_name: 'กุญแจรถยนต์ Toyota',
    categoryName: 'กุญแจ',
    locationName: 'ลานจอดรถชั้น B1',
    lost_datetime: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    description: 'กุญแจมีพวงกุญแจรูปตุ๊กตาหมี',
    status: 'LOST',
    image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500',
    reporterName: 'ธนา ดีใจ',
    reporterPhone: '083-456-7890'
  }
]

export const useItemsStore = defineStore('items', {
  state: () => ({
    lostItems: [] as any[],
    foundItems: [] as any[],
    categories: [] as any[],
    locations: [] as any[],
    lockers: [] as any[],
    loading: false,
    lastUpdated: null as Date | null,
  }),
  actions: {
    async fetchMasterData() {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      try {
        const headers = authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}
        
        // Categories and Locations do not require authorization in the backend routes
        const [catRes, locRes] = await Promise.all([
          axios.get(`${config.public.apiBaseUrl}/master/categories`),
          axios.get(`${config.public.apiBaseUrl}/master/locations`)
        ])

        this.categories = catRes.data || []
        this.locations = locRes.data || []

        try {
          // Lockers require auth token
          const lockRes = await axios.get(`${config.public.apiBaseUrl}/master/lockers`, { headers })
          this.lockers = lockRes.data || []
        } catch (lockError) {
          console.warn('Could not fetch lockers from backend, checking token/mock:', lockError)
          if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
            this.lockers = [...MOCK_LOCKERS]
          } else {
            this.lockers = []
          }
        }
      } catch (error) {
        console.error('Error fetching master data from Supabase:', error)
        // Fallback to mock data if backend is offline or during mock testing
        if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
          this.categories = [...MOCK_CATEGORIES]
          this.locations = [...MOCK_LOCATIONS]
          this.lockers = [...MOCK_LOCKERS]
        }
      }
    },

    async fetchLostItems() {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        this.lostItems = [...MOCK_LOST]
        return
      }

      try {
        const response = await axios.get(`${config.public.apiBaseUrl}/lost-items`, {
          params: { page: 1, limit: 1000 }
        })
        this.lostItems = response.data.items || response.data || []
      } catch (error) {
        console.error('Error fetching lost items:', error)
        this.lostItems = []
      }
    },

    async fetchFoundItems() {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        this.foundItems = [...MOCK_FOUND]
        return
      }

      try {
        const response = await axios.get(`${config.public.apiBaseUrl}/found-items`, {
          params: { page: 1, limit: 1000 }
        })
        this.foundItems = response.data.items || response.data || []
      } catch (error) {
        console.error('Error fetching found items:', error)
        this.foundItems = []
      }
    },

    async fetchItems() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchLostItems(),
          this.fetchFoundItems(),
          this.fetchMasterData()
        ])
        this.lastUpdated = new Date()
      } catch (error) {
        console.error('Error in fetchItems:', error)
      } finally {
        this.loading = false
      }
    },

    async findOrCreatePerson(personData: any) {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        return { person_id: Date.now() }
      }

      const response = await axios.post(`${config.public.apiBaseUrl}/master/persons/find-or-create`, personData, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      return response.data
    },

    async createLocation(locationName: string) {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        const newLoc = {
          location_id: Date.now(),
          location_name: locationName
        }
        this.locations.push(newLoc)
        return newLoc
      }

      const response = await axios.post(`${config.public.apiBaseUrl}/master/locations`, {
        location_name: locationName,
        description: 'สร้างจากผู้ใช้งานแจ้งพบของ'
      }, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })

      // Fetch master locations to keep local state updated
      const locRes = await axios.get(`${config.public.apiBaseUrl}/master/locations`)
      this.locations = locRes.data || []

      return response.data
    },

    async createLostItem(itemData: any, reporterData: any, imageFile: any = null) {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        const newMock = {
          lost_item_id: Date.now(),
          item_name: itemData.item_name,
          categoryName: this.categories.find(c => c.category_id === itemData.category_id)?.category_name || 'อื่นๆ',
          locationName: this.locations.find(l => l.location_id === itemData.location_id)?.location_name || 'ไม่ระบุ',
          floor: itemData.floor || '',
          lost_datetime: itemData.lost_datetime,
          description: itemData.description,
          status: 'LOST',
          reporterName: reporterData.full_name,
          reporterPhone: reporterData.phone,
          image_url: imageFile ? URL.createObjectURL(imageFile) : null
        }
        MOCK_LOST.unshift(newMock)
        await this.fetchLostItems()
        return { lost_item_id: newMock.lost_item_id }
      }

      // 1. Find or create the reporter
      const reporter = await this.findOrCreatePerson(reporterData)
      
      // 2. Post lost item using FormData
      const formData = new FormData()
      formData.append('item_name', itemData.item_name)
      formData.append('category_id', String(itemData.category_id))
      formData.append('location_id', String(itemData.location_id))
      formData.append('floor', itemData.floor || '')
      formData.append('lost_datetime', itemData.lost_datetime)
      formData.append('description', itemData.description || '')
      formData.append('reporter_id', String(reporter.person_id))
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await axios.post(`${config.public.apiBaseUrl}/lost-items`, formData, {
        headers: { 
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      await this.fetchLostItems()
      return response.data
    },

    async createFoundItem(itemData: any, finderData: any, imageFile: any = null) {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        const newMock = {
          found_item_id: Date.now(),
          item_name: itemData.item_name,
          categoryName: this.categories.find(c => c.category_id === itemData.category_id)?.category_name || 'อื่นๆ',
          locationName: this.locations.find(l => l.location_id === itemData.location_id)?.location_name || 'ไม่ระบุ',
          floor: itemData.floor || '',
          found_date: itemData.found_date,
          description: itemData.description,
          status: 'FOUND',
          lockerCode: this.lockers.find(l => l.locker_id === itemData.locker_id)?.locker_code || '-',
          finderName: finderData.full_name,
          finderPhone: finderData.phone,
          image_url: imageFile ? URL.createObjectURL(imageFile) : null
        }
        MOCK_FOUND.unshift(newMock)
        await this.fetchFoundItems()
        return { found_item_id: newMock.found_item_id }
      }

      // 1. Find or create the finder
      const finder = await this.findOrCreatePerson(finderData)

      // 2. Post found item using FormData
      const formData = new FormData()
      formData.append('item_name', itemData.item_name)
      formData.append('category_id', String(itemData.category_id))
      formData.append('location_id', String(itemData.location_id))
      formData.append('floor', itemData.floor || '')
      formData.append('found_date', itemData.found_date)
      formData.append('description', itemData.description || '')
      formData.append('locker_id', String(itemData.locker_id))
      formData.append('finder_id', String(finder.person_id))
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await axios.post(`${config.public.apiBaseUrl}/found-items`, formData, {
        headers: { 
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      await this.fetchFoundItems()
      return response.data
    },

    async updateLostItem(id: number, itemData: any, reporterData: any, imageFile: any = null) {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        const itemIdx = MOCK_LOST.findIndex(i => i.lost_item_id === id)
        if (itemIdx > -1) {
          MOCK_LOST[itemIdx] = {
            ...MOCK_LOST[itemIdx],
            item_name: itemData.item_name,
            categoryName: this.categories.find(c => c.category_id === itemData.category_id)?.category_name || 'อื่นๆ',
            locationName: this.locations.find(l => l.location_id === itemData.location_id)?.location_name || 'ไม่ระบุ',
            floor: itemData.floor || '',
            lost_datetime: itemData.lost_datetime,
            description: itemData.description,
            reporterName: reporterData.full_name,
            reporterPhone: reporterData.phone,
            image_url: imageFile ? URL.createObjectURL(imageFile) : MOCK_LOST[itemIdx].image_url
          }
        }
        await this.fetchLostItems()
        return
      }

      const reporter = await this.findOrCreatePerson(reporterData)

      const formData = new FormData()
      formData.append('item_name', itemData.item_name)
      formData.append('category_id', String(itemData.category_id))
      formData.append('location_id', String(itemData.location_id))
      formData.append('floor', itemData.floor || '')
      formData.append('lost_datetime', itemData.lost_datetime)
      formData.append('description', itemData.description || '')
      formData.append('status', itemData.status || 'LOST')
      formData.append('reporter_id', String(reporter.person_id))
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await axios.put(`${config.public.apiBaseUrl}/lost-items/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      await this.fetchLostItems()
      return response.data
    },

    async updateFoundItem(id: number, itemData: any, finderData: any, imageFile: any = null) {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        const itemIdx = MOCK_FOUND.findIndex(i => i.found_item_id === id)
        if (itemIdx > -1) {
          MOCK_FOUND[itemIdx] = {
            ...MOCK_FOUND[itemIdx],
            item_name: itemData.item_name,
            categoryName: this.categories.find(c => c.category_id === itemData.category_id)?.category_name || 'อื่นๆ',
            locationName: this.locations.find(l => l.location_id === itemData.location_id)?.location_name || 'ไม่ระบุ',
            floor: itemData.floor || '',
            found_date: itemData.found_date,
            description: itemData.description,
            status: itemData.status || 'FOUND',
            lockerCode: this.lockers.find(l => l.locker_id === itemData.locker_id)?.locker_code || '-',
            finderName: finderData.full_name,
            finderPhone: finderData.phone,
            image_url: imageFile ? URL.createObjectURL(imageFile) : MOCK_FOUND[itemIdx].image_url
          }
        }
        await this.fetchFoundItems()
        return
      }

      const finder = await this.findOrCreatePerson(finderData)

      const formData = new FormData()
      formData.append('item_name', itemData.item_name)
      formData.append('category_id', String(itemData.category_id))
      formData.append('location_id', String(itemData.location_id))
      formData.append('floor', itemData.floor || '')
      formData.append('found_date', itemData.found_date)
      formData.append('description', itemData.description || '')
      formData.append('status', itemData.status || 'FOUND')
      formData.append('locker_id', String(itemData.locker_id))
      formData.append('finder_id', String(finder.person_id))
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await axios.put(`${config.public.apiBaseUrl}/found-items/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      await this.fetchFoundItems()
      return response.data
    }
  },
  getters: {
    items: (state) => {
      const mappedFound = state.foundItems.map(item => ({
        id: item.found_item_id,
        dbId: item.found_item_id,
        type: 'found',
        name: item.item_name,
        category: item.categoryName || 'อื่นๆ',
        category_id: item.category_id,
        place: item.locationName || 'ไม่ระบุ',
        location_id: item.location_id,
        floor: item.floor || '',
        date: item.found_date,
        description: item.description,
        status: item.status.toLowerCase(),
        locker: item.lockerCode || '-',
        locker_id: item.locker_id,
        image_url: item.image_url || null,
        finderName: item.Person?.full_name || item.finderName,
        finderPhone: item.Person?.phone || item.finderPhone,
        finderType: item.Person?.person_type || 'STUDENT',
        finderStudentId: item.Person?.student_id || '',
        finderEmail: item.Person?.email || ''
      }))

      const mappedLost = state.lostItems.map(item => ({
        id: item.lost_item_id,
        dbId: item.lost_item_id,
        type: 'lost',
        name: item.item_name,
        category: item.categoryName || 'อื่นๆ',
        category_id: item.category_id,
        place: item.locationName || 'ไม่ระบุ',
        location_id: item.location_id,
        floor: item.floor || '',
        date: item.lost_datetime,
        description: item.description,
        status: item.status.toLowerCase(),
        locker: '-',
        image_url: item.image_url || null,
        reporterName: item.Person?.full_name || item.reporterName,
        reporterPhone: item.Person?.phone || item.reporterPhone,
        reporterType: item.Person?.person_type || 'STUDENT',
        reporterStudentId: item.Person?.student_id || '',
        reporterEmail: item.Person?.email || ''
      }))

      return [...mappedFound, ...mappedLost]
    },
    countByStatus: (state) => (status: string) => {
      const itemsList = [
        ...state.foundItems.map(item => item.status.toLowerCase()),
        ...state.lostItems.map(item => item.status.toLowerCase())
      ]
      return itemsList.filter(s => {
        if (status === 'found') return s === 'found' || s === 'stored'
        if (status === 'claimed') return s === 'claimed' || s === 'returned'
        return s === status
      }).length
    },
    countExpired: (state) => {
      const now = new Date()
      return state.foundItems.filter(item => {
        const diff = (now.getTime() - new Date(item.found_date).getTime()) / (1000 * 60 * 60 * 24)
        return (item.status === 'STORED' || item.status === 'FOUND') && diff > 30
      }).length
    }
  }
})
