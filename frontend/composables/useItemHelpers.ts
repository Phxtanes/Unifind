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
    if (!item.id) return 'FND-2026-0001'
    const prefix = item.status === 'lost' ? 'LST' : 'FND'
    const year = dayjs(item.date).format('YYYY')
    const padId = String(item.id).slice(-4).padStart(4, '0')
    return `${prefix}-${year}-${padId}`
  }

  const getItemImageSrc = (item: any) => {
    const path = item.picture || item.image_url
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `http://localhost:9001${path}`
  }

  const formatDate = (dateStr: any) => dayjs(dateStr).format('D MMM YYYY HH:mm')
  const formatDateShort = (dateStr: any) => dayjs(dateStr).format('D มิ.ย. YY')
  const formatFullDate = (dateStr: any) => dayjs(dateStr).format('DD MMMM YYYY HH:mm น.')

  const changeStatus = async (id: number, newStatus: string) => {
    try {
      const dbStatus = newStatus === 'found' ? 'stored' : newStatus === 'claimed' ? 'removed' : newStatus

      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        const idx = itemsStore.items.findIndex(item => item.id === id)
        if (idx !== -1) itemsStore.items[idx].status = dbStatus
        return
      }

      await axios.put(`${config.public.apiBaseUrl}/lost-items/${id}`, { status: dbStatus }, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })

      const idx = itemsStore.items.findIndex(item => item.id === id)
      if (idx !== -1) itemsStore.items[idx].status = dbStatus
      itemsStore.fetchItems()
    } catch (error) {
      console.error('Error changing status:', error)
      alert('เกิดข้อผิดพลาดในการแก้ไขสถานะ')
    }
  }

  const deleteItem = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการบันทึกนี้ออกจากระบบอย่างถาวร?')) return

    try {
      if (authStore.token === 'bypass-token-12345' || authStore.token === 'mock-token') {
        itemsStore.items = itemsStore.items.filter(item => item.id !== id)
        return
      }

      await axios.delete(`${config.public.apiBaseUrl}/lost-items/delete/${id}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })

      itemsStore.items = itemsStore.items.filter(item => item.id !== id)
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  return {
    translateCategory,
    getMockCode,
    getItemImageSrc,
    formatDate,
    formatDateShort,
    formatFullDate,
    changeStatus,
    deleteItem
  }
}
