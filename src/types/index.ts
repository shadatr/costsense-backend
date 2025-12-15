export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message?: string
  data?: T
  error?: string
}

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
  hasMore?: boolean
}

export interface PaginatedResponse<T> {
  status: 'success'
  data: T[]
  pagination: PaginationMeta
}

export interface ErrorResponse {
  status: 'error'
  message: string
  errors?: any[]
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: {
    id: string
    name: string | null
    email: string
  }
  accessToken: string
  refreshToken: string
}
