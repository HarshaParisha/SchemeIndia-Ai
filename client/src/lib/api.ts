import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export async function withAuthHeader(getToken: (() => Promise<string | null>) | undefined) {
  const token = getToken ? await getToken() : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

