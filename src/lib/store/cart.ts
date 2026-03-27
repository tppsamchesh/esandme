import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  title: string
  price: number
  image: string
  quantity: number
  variant?: {
    title: string
    sku: string
  }
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(i => i.id === item.id)
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          }))
        } else {
          set(state => ({ items: [...state.items, item] }))
        }
      },
      removeItem: (id) => set(state => ({
        items: state.items.filter(i => i.id !== id)
      })),
      updateQuantity: (id, quantity) => set(state => ({
        items: state.items.map(i => i.id === id ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'esandme-cart' }
  )
)
