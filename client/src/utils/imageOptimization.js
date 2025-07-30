/**
 * Image optimization utilities for performance
 */

// Image format detection and optimization
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return null
  
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options
  
  // For external images, return as-is
  if (url.startsWith('http')) {
    return url
  }
  
  // For local images, apply optimization parameters
  const params = new URLSearchParams()
  if (width) params.set('w', width)
  if (height) params.set('h', height)
  if (quality) params.set('q', quality)
  if (format) params.set('f', format)
  
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

// Lazy loading intersection observer
export const createImageObserver = (callback) => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    return {
      observe: () => callback(),
      disconnect: () => {}
    }
  }
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target)
        }
      })
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  )
}

// Image preloading for critical images
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// WebP support detection
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

// Image compression for uploads
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'image/jpeg'
  } = options
  
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(resolve, format, quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Generate responsive image srcSet
export const generateSrcSet = (baseUrl, sizes = [320, 640, 768, 1024, 1280]) => {
  return sizes
    .map(size => `${getOptimizedImageUrl(baseUrl, { width: size })} ${size}w`)
    .join(', ')
}