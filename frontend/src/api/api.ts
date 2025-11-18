import axios from 'axios'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.trim()) ||
  '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Task {
  id?: number
  user_id: number
  title: string
  description?: string
  completed?: boolean
  due_date?: string
  start_time?: string
  end_time?: string
  priority?: number
  created_by?: string
  updated_by?: string
}

export interface Event {
  id?: number
  user_id: number
  title: string
  description?: string
  start_date: string
  end_date: string
  all_day?: boolean
  location?: string
  color?: string
}

// Tasks API
export const tasksApi = {
  getAll: async (filters?: {
    completed?: boolean
    due_date?: string
    priority?: number
  }) => {
    const params = new URLSearchParams()
    params.append('user_id', '1') // 임시로 user_id 1 사용
    
    if (filters?.completed !== undefined) {
      params.append('completed', String(filters.completed))
    }
    if (filters?.due_date) {
      params.append('due_date', filters.due_date)
    }
    if (filters?.priority !== undefined) {
      params.append('priority', String(filters.priority))
    }

    const response = await api.get(`/tasks?${params.toString()}`)
    return response.data
  },

  create: async (task: Omit<Task, 'id'>) => {
    const response = await api.post('/tasks', { ...task, user_id: 1 })
    return response.data
  },

  update: async (id: number, task: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, { ...task, user_id: 1 })
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/tasks/${id}?user_id=1`)
  },
}

// Events API
export const eventsApi = {
  getAll: async (filters?: {
    start_date?: string
    end_date?: string
    month?: number
    year?: number
  }) => {
    const params = new URLSearchParams()
    params.append('user_id', '1')
    
    if (filters?.start_date && filters?.end_date) {
      params.append('start_date', filters.start_date)
      params.append('end_date', filters.end_date)
    } else if (filters?.month !== undefined && filters?.year !== undefined) {
      params.append('month', String(filters.month + 1)) // month는 0-based
      params.append('year', String(filters.year))
    }

    const response = await api.get(`/events?${params.toString()}`)
    return response.data
  },

  create: async (event: Omit<Event, 'id'>) => {
    const response = await api.post('/events', { ...event, user_id: 1 })
    return response.data
  },

  update: async (id: number, event: Partial<Event>) => {
    const response = await api.put(`/events/${id}`, { ...event, user_id: 1 })
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/events/${id}?user_id=1`)
  },
}

export default api

