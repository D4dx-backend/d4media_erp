// API Configuration
const getApiUrl = () => {
  // Try environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Production fallback
  if (import.meta.env.PROD || window.location.hostname.includes('netlify')) {
    return 'https://d4media-erp-hxqid.ondigitalocean.app/api/v1'
  }
  
  // Development fallback
  return 'http://localhost:5000/api/v1'
}

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
}

console.log('API Config loaded:', API_CONFIG)

export default API_CONFIG