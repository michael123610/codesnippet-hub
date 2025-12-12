import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
}

// 代码片段API
export const snippetAPI = {
  getList: (params) => api.get('/snippets', { params }),
  getById: (id) => api.get(`/snippets/${id}`),
  create: (data) => api.post('/snippets', data),
  update: (id, data) => api.put(`/snippets/${id}`, data),
  delete: (id) => api.delete(`/snippets/${id}`),
  like: (id) => api.post(`/snippets/${id}/like`),
  favorite: (id) => api.post(`/snippets/${id}/favorite`)
}

// 用户API
export const userAPI = {
  getById: (id) => api.get(`/users/${id}`),
  getSnippets: (id, params) => api.get(`/users/${id}/snippets`, { params }),
  getMySnippets: (params) => api.get('/users/me/snippets', { params }),
  getFavorites: (params) => api.get('/users/me/favorites', { params })
}

// 标签API
export const tagAPI = {
  getAll: () => api.get('/tags'),
  getPopular: (limit = 20) => api.get('/tags/popular', { params: { limit } })
}

export default api