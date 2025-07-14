// Basic performance tracking utility
export function trackPerformance(name: string, duration: number) {
  if (typeof window !== 'undefined') {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration}ms`)
    }
    
    // Send to analytics service in production
    // Replace with your preferred analytics service
    // Example: analytics.track('performance', { name, duration })
  }
}

// Hook for tracking component render times
export function usePerformanceTracking(componentName: string) {
  if (typeof window !== 'undefined') {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      trackPerformance(`${componentName} render`, duration)
    }
  }
  
  return () => {}
}

// Query performance tracking
export function trackQueryPerformance(queryKey: string, duration: number, status: 'success' | 'error') {
  trackPerformance(`Query: ${queryKey}`, duration)
  
  if (status === 'error') {
    console.warn(`Query ${queryKey} failed after ${duration}ms`)
  }
}