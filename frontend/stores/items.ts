import { defineStore } from 'pinia'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'

// ─── Mock data (fallback when auth token is mock) ────────────────────────────

const MOCK_CATEGORIES = [
  { category_id: 1, category_name: 'เอกสาร' },
  { category_id: 2, category_name: 'กระเป๋า' },
  { category_id: 3, category_name: 'โทรศัพท์' },
  { category_id: 4, category_name: 'กุญแจ' },
  { category_id: 5, category_name: 'เครื่องประดับ' },
]

const MOCK_LOCATIONS = [
  { location_id: 1, location_name: 'อาคาร 24', floor: null },
  { location_id: 2, location_name: 'อาคาร 6',  floor: null },
  { location_id: 3, location_name: 'โรงอาหาร', floor: null },
  { location_id: 4, location_name: 'ห้องสมุด', floor: null },
]

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Item {
  item_id: number
  item_name: string
  categoryName: string | null
  locationName: string | null
  found_date: string
  description: string
  status: string | null        // status_code e.g. 'FOUND', 'STORED', 'CLAIMED'
  locker_id: string | null     // VARCHAR now (not FK)
  image_url: string | null
  finder_id: number | null
  finderName: string | null
  finderPhone: string | null
  claimer_id: number | null
  claimerName: string | null
  claim_date: string | null
  remark: string | null
  created_by: number | null
  staffName: string | null
  created_at: string | null
  updated_at: string | null
}

interface LostItem {
  lost_item_id: number
  item_name: string
  categoryName: string | null
  locationName: string | null
  lost_datetime: string
  description: string
  status: string | null
  image_url: string | null
  reporter_id: number | null
  reporterName: string | null
  reporterPhone: string | null
  created_at: string | null
  updated_at: string | null
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useItemsStore = defineStore('items', {
  state: () => ({
    lostItems:  [] as any[],
    foundItems: [] as any[],   // items from /api/items (found items)
    categories: [] as any[],
    locations:  [] as any[],
    buildings:  [] as any[],
    loading: false,
    lastUpdated: null as Date | null,
  }),

  actions: {
    // ── Master data ──────────────────────────────────────────────────────────

    async fetchMasterData() {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      try {
        const [catRes, locRes, bldRes] = await Promise.all([
          axios.get(`${config.public.apiBaseUrl}/master/categories`),
          axios.get(`${config.public.apiBaseUrl}/master/locations`),
          axios.get(`${config.public.apiBaseUrl}/master/buildings`),
        ])
        this.categories = catRes.data || []
        this.locations  = locRes.data || []
        this.buildings  = bldRes.data || []
      } catch (error) {
        console.error('Error fetching master data:', error)
        if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
          this.categories = [...MOCK_CATEGORIES]
          this.locations  = [...MOCK_LOCATIONS]
          this.buildings  = []
        }
      }
    },

    // ── Found items (items table) ─────────────────────────────────────────────

    async fetchFoundItems() {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      try {
        const response = await axios.get(`${config.public.apiBaseUrl}/items`, {
          params: { page: 1, limit: 1000 },
        })
        this.foundItems = response.data.items || response.data || []
      } catch (error) {
        console.error('Error fetching items:', error)
        this.foundItems = []
      }
    },

    // ── Lost items ────────────────────────────────────────────────────────────

    async fetchLostItems() {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      try {
        const response = await axios.get(`${config.public.apiBaseUrl}/lost-items`, {
          params: { page: 1, limit: 1000 },
        })
        this.lostItems = response.data.items || response.data || []
      } catch (error) {
        console.error('Error fetching lost items:', error)
        this.lostItems = []
      }
    },

    async fetchItems() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchFoundItems(),
          this.fetchLostItems(),
          this.fetchMasterData(),
        ])
        this.lastUpdated = new Date()
      } catch (error) {
        console.error('Error in fetchItems:', error)
      } finally {
        this.loading = false
      }
    },

    // ── Persons ───────────────────────────────────────────────────────────────

    async findOrCreatePerson(personData: any) {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      const response = await axios.post(
        `${config.public.apiBaseUrl}/master/persons/find-or-create`,
        personData,
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )
      return response.data
    },

    // ── Locations ─────────────────────────────────────────────────────────────

    async createLocation(locationName: string, buildingId: number | null = null) {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      const response = await axios.post(
        `${config.public.apiBaseUrl}/master/locations`,
        { location_name: locationName, building_id: buildingId, description: 'สร้างจากระบบ' },
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )
      const locRes = await axios.get(`${config.public.apiBaseUrl}/master/locations`)
      this.locations = locRes.data || []
      return response.data
    },

    // ── Categories ────────────────────────────────────────────────────────────

    async createCategory(categoryName: string, description: string = 'สร้างจากระบบ') {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      const response = await axios.post(
        `${config.public.apiBaseUrl}/master/categories`,
        { category_name: categoryName, description },
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )
      const catRes = await axios.get(`${config.public.apiBaseUrl}/master/categories`)
      this.categories = catRes.data || []
      return response.data
    },

    // ── Create Found Item (/api/items) ────────────────────────────────────────

    async createFoundItem(itemData: any, finderData: any, imageFile: any = null) {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      // 1. Find or create the finder person
      const finder = await this.findOrCreatePerson(finderData)

      // 2. Build FormData
      const formData = new FormData()
      formData.append('item_name',   itemData.item_name)
      formData.append('category_id', String(itemData.category_id))
      formData.append('location_id', String(itemData.location_id))
      formData.append('found_date',  itemData.found_date || new Date().toISOString())
      formData.append('description', itemData.description || '')
      formData.append('status',      itemData.status || 'FOUND')
      formData.append('locker_id',   itemData.locker_id || '')
      formData.append('finder_id',   String(finder.person_id))
      if (imageFile) formData.append('image', imageFile)

      const response = await axios.post(`${config.public.apiBaseUrl}/items`, formData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      await this.fetchFoundItems()
      return response.data
    },

    // ── Update Found Item ─────────────────────────────────────────────────────

    async updateFoundItem(id: number, itemData: any, finderData: any, imageFile: any = null) {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      const finder = await this.findOrCreatePerson(finderData)

      const formData = new FormData()
      formData.append('item_name',   itemData.item_name)
      formData.append('category_id', String(itemData.category_id))
      formData.append('location_id', String(itemData.location_id))
      formData.append('found_date',  itemData.found_date || '')
      formData.append('description', itemData.description || '')
      formData.append('status',      itemData.status || 'FOUND')
      formData.append('locker_id',   itemData.locker_id || '')
      formData.append('finder_id',   String(finder.person_id))
      if (imageFile) formData.append('image', imageFile)

      const response = await axios.put(`${config.public.apiBaseUrl}/items/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      await this.fetchFoundItems()
      return response.data
    },

    // ── Claim Found Item (POST /api/items/:id/claim) ──────────────────────────

    async claimFoundItem(foundItemId: number, claimerData: any) {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      // 1. Find or create the claimer person
      const claimer = await this.findOrCreatePerson({
        full_name:  claimerData.full_name,
        person_type: claimerData.person_type || 'STUDENT',
        student_id: claimerData.student_id || '',
        phone:      claimerData.phone || '',
        email:      claimerData.email || '',
        department: claimerData.department || '',
      })

      // 2. Record the claim
      const response = await axios.post(
        `${config.public.apiBaseUrl}/items/${foundItemId}/claim`,
        {
          claimer_id: claimer.person_id,
          claim_date: new Date().toISOString(),
          remark:     claimerData.remark || 'ส่งคืนของสำเร็จ',
          status:     'CLAIMED',
        },
        { headers: { Authorization: `Bearer ${authStore.token}` } },
      )

      await this.fetchItems()
      return response.data
    },

    // ── Create Lost Item ──────────────────────────────────────────────────────

    async createLostItem(itemData: any, reporterData: any, imageFile: any = null) {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      // 1. Find or create the reporter
      const reporter = await this.findOrCreatePerson(reporterData)

      // 2. Build FormData
      const formData = new FormData()
      formData.append('item_name',    itemData.item_name)
      formData.append('category_id',  String(itemData.category_id))
      formData.append('location_id',  String(itemData.location_id))
      formData.append('lost_datetime', itemData.lost_datetime || new Date().toISOString())
      formData.append('description',  itemData.description || '')
      formData.append('status',       'LOST')
      formData.append('reporter_id',  String(reporter.person_id))
      if (imageFile) formData.append('image', imageFile)

      const response = await axios.post(`${config.public.apiBaseUrl}/lost-items`, formData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      await this.fetchLostItems()
      return response.data
    },

    // ── Update Lost Item ──────────────────────────────────────────────────────

    async updateLostItem(id: number, itemData: any, reporterData: any, imageFile: any = null) {
      const config    = useRuntimeConfig()
      const authStore = useAuthStore()

      const reporter = await this.findOrCreatePerson(reporterData)

      const formData = new FormData()
      formData.append('item_name',    itemData.item_name)
      formData.append('category_id',  String(itemData.category_id))
      formData.append('location_id',  String(itemData.location_id))
      formData.append('lost_datetime', itemData.lost_datetime || '')
      formData.append('description',  itemData.description || '')
      formData.append('status',       itemData.status || 'LOST')
      formData.append('reporter_id',  String(reporter.person_id))
      if (imageFile) formData.append('image', imageFile)

      const response = await axios.put(`${config.public.apiBaseUrl}/lost-items/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      await this.fetchLostItems()
      return response.data
    },
  },

  getters: {
    // Unified item list used by dashboard/found/lost pages
    items: (state) => {
      const mappedFound = state.foundItems.map((item: any) => ({
        id:         item.item_id || item.id,
        dbId:       item.item_id || item.id,
        type:       'found',
        name:       item.item_name || item.name,
        category:   item.categoryName || item.category || 'อื่นๆ',
        category_id: item.category_id,
        place:      item.locationName || item.place || 'ไม่ระบุ',
        location_id: item.location_id,
        date:       item.found_date || item.date,
        description: item.description,
        status:     (item.status || '').toLowerCase(),
        statusName: item.statusName || null,
        locker:     item.locker_id || '-',
        locker_id:  item.locker_id || null,
        image_url:  item.image_url || item.picture || null,
        finder_id:  item.finder_id,
        finderName:     item.finderName || item.Person?.full_name || null,
        finderPhone:    item.finderPhone || item.Person?.phone || null,
        finderType:     item.finderType  || item.Person?.person_type || 'STUDENT',
        finderStudentId: item.finderStudentId || item.Person?.student_id || '',
        finderEmail:    item.finderEmail || item.Person?.email || '',
        claimer_id:     item.claimer_id || null,
        claimerName:    item.claimerName || null,
        claimerPhone:   item.claimerPhone || null,
        claimerStudentId: item.claimerStudentId || null,
        claimerEmail:   item.claimerEmail || null,
        claimerType:    item.claimerType || null,
        claim_date:     item.claim_date || null,
        remark:         item.remark || null,
        staffName:      item.staffName || item.namereport || null,
        created_at:     item.created_at || null,
        updated_at:     item.updated_at || null,
      }))

      const mappedLost = state.lostItems.map((item: any) => ({
        id:         item.lost_item_id || item.id,
        dbId:       item.lost_item_id || item.id,
        type:       'lost',
        name:       item.item_name || item.name,
        category:   item.categoryName || item.category || 'อื่นๆ',
        category_id: item.category_id,
        place:      item.locationName || item.place || 'ไม่ระบุ',
        location_id: item.location_id,
        date:       item.lost_datetime || item.date,
        description: item.description,
        status:     (item.status || 'lost').toLowerCase(),
        statusName: item.statusName || null,
        locker:     '-',
        locker_id:  null,
        image_url:  item.image_url || item.picture || null,
        reporter_id:    item.reporter_id,
        reporterName:   item.reporterName || item.Person?.full_name || null,
        reporterPhone:  item.reporterPhone || item.Person?.phone || null,
        reporterType:   item.reporterType  || item.Person?.person_type || 'STUDENT',
        reporterStudentId: item.reporterStudentId || item.Person?.student_id || '',
        reporterEmail:  item.reporterEmail || item.Person?.email || '',
        staffName:      item.staffName || null,
        created_at:     item.created_at || null,
        updated_at:     item.updated_at || null,
      }))

      const allMerged = [...mappedFound, ...mappedLost]
      const seen = new Set()
      return allMerged.filter((item) => {
        if (!item.id) return false
        const key = `${item.type}-${item.id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },

    countByStatus: (state) => (status: string) => {
      const foundStatuses = state.foundItems.map((i: any) => (i.status || '').toLowerCase())
      const lostStatuses  = state.lostItems.map((i: any) => (i.status || '').toLowerCase())

      if (status === 'found') {
        return foundStatuses.filter((s: string) => s === 'found' || s === 'stored').length
      }
      if (status === 'claimed') {
        return foundStatuses.filter((s: string) => s === 'claimed' || s === 'returned').length
      }
      if (status === 'lost') {
        return lostStatuses.filter((s: string) => s === 'lost').length
      }
      return [...foundStatuses, ...lostStatuses].filter((s: string) => s === status).length
    },

    countExpired: (state) => {
      const now = new Date()
      return state.foundItems.filter((item: any) => {
        if (!item.found_date) return false
        const diff = (now.getTime() - new Date(item.found_date).getTime()) / (1000 * 60 * 60 * 24)
        const s = (item.status || '').toUpperCase()
        return (s === 'STORED' || s === 'FOUND') && diff > 30
      }).length
    },
  },
})
