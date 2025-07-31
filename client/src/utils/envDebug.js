// Environment debugging utility
export const logEnvironmentInfo = () => {
  console.group('🔧 Environment Debug Info')
  console.log('Mode:', import.meta.env.MODE)
  console.log('Dev:', import.meta.env.DEV)
  console.log('Prod:', import.meta.env.PROD)
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('Base URL:', import.meta.env.BASE_URL)
  console.log('Window location:', window.location.href)
  console.log('All env vars:', import.meta.env)
  console.groupEnd()
}

// Call this on app startup
if (import.meta.env.DEV) {
  logEnvironmentInfo()
}