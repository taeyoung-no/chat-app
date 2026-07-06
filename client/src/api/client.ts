import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:8443',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export default api
