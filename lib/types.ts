export type ItemStatus = 'pending' | 'found' | 'not_found'
export type ListStatus = 'draft' | 'active' | 'completed'

export interface ListItem {
  id: string
  list_id: string
  name: string
  section: string
  status: ItemStatus
  order_index: number
  created_at: string
}

export interface ShoppingList {
  id: string
  status: ListStatus
  created_at: string
}

export interface PresetItem {
  id: string
  name: string
  section: string
}

export interface SectionGroup {
  id: string
  name: string
  store: 'assai' | 'covabra'
  order: number
  items: ListItem[]
}
