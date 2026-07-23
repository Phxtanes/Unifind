import dayjs from 'dayjs'
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'
import { useItemsStore } from '~/stores/items'

export const useItemHelpers = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const itemsStore = useItemsStore()

  const translateCategory = (cat: string) => {
    const mapping: Record<string, string> = {
      'Electronics': 'อุปกรณ์อิเล็กทรอนิกส์',
      'Documents': 'เอกสารสำคัญ',
      'Clothing': 'เสื้อผ้า / เครื่องแต่งกาย',
      'Accessories': 'เครื่องประดับ / ของใช้ส่วนตัว',
      'Other': 'อื่นๆ'
    }
    return mapping[cat] || cat
  }

  const getMockCode = (item: any) => {
    if (!item || !item.id) return 'FND-2026-0001'
    const prefix = item.status === 'lost' ? 'LST' : 'FND'
    const year = dayjs(item.date).format('YYYY')
    const padId = String(item.id).slice(-4).padStart(4, '0')
    return `${prefix}-${year}-${padId}`
  }

  const getItemImageSrc = (item: any) => {
    if (!item) return ''
    const path = item.picture || item.image_url
    if (!path) return ''
    if (path.startsWith('http')) return path
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBaseUrl || 'http://localhost:9001/api'
    const origin = apiBase.replace(/\/api\/?$/, '')
    return `${origin}${path}`
  }

  const formatDate = (dateStr: any) => dayjs(dateStr).format('D MMM YYYY HH:mm')
  const formatDateShort = (dateStr: any) => dayjs(dateStr).format('D มิ.ย. YY')
  const formatFullDate = (dateStr: any) => dayjs(dateStr).format('DD MMMM YYYY HH:mm น.')

  const formatDescription = (desc: string) => {
    if (!desc) return 'ไม่มีรายละเอียดเพิ่มเติม'
    try {
      const trimmed = desc.trim()
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object' && 'textDescription' in parsed) {
          return parsed.textDescription || 'ไม่มีรายละเอียดเพิ่มเติม'
        }
      }
    } catch (e) {
      // Treat as raw text
    }
    return desc
  }

  const changeStatus = async (id: number, newStatus: string, reason?: string) => {
    try {
      const item = itemsStore.items.find(i => i.id === id)
      if (!item) return

      const isLost = item.type === 'lost'
      const endpoint = isLost ? 'lost-items' : 'items'

      let dbStatus = ''
      if (isLost) {
        dbStatus = newStatus === 'lost' ? 'LOST' : 'CLOSED'
      } else {
        dbStatus = newStatus === 'lost' ? 'FOUND' : newStatus === 'found' ? 'STORED' : 'CLAIMED'
      }

      const body: any = { status: dbStatus }
      if (reason && !isLost) {
        const currentDesc = item.description || ''
        body.description = currentDesc
          ? `${currentDesc}\n[นำกลับไปยังคลังเนื่องจาก: ${reason}]`
          : `[นำกลับไปยังคลังเนื่องจาก: ${reason}]`
      }

      await axios.put(`${config.public.apiBaseUrl}/${endpoint}/${id}`, body, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })

      await itemsStore.fetchItems()
    } catch (error: any) {
      console.error('Error changing status:', error)
      if (error.response?.status === 401) {
        alert('เซสชันการใช้งานของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
        authStore.logout()
        navigateTo('/')
      } else {
        alert('เกิดข้อผิดพลาดในการแก้ไขสถานะ')
      }
    }
  }

  const deleteItem = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการบันทึกนี้ออกจากระบบอย่างถาวร?')) return

    try {
      const item = itemsStore.items.find(i => i.id === id)
      if (!item) return

      const isLost = item.type === 'lost'
      const endpoint = isLost ? 'lost-items' : 'items'

      await axios.delete(`${config.public.apiBaseUrl}/${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })

      await itemsStore.fetchItems()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      if (error.response?.status === 401) {
        alert('เซสชันการใช้งานของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
        authStore.logout()
        navigateTo('/')
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล')
      }
    }
  }

  return {
    translateCategory,
    getMockCode,
    getItemImageSrc,
    formatDate,
    formatDateShort,
    formatFullDate,
    formatDescription,
    changeStatus,
    deleteItem
  }
}
