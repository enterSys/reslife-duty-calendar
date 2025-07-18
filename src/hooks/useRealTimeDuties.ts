"use client"

import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface DutyChangeEvent {
  type: 'duty-updated' | 'duty-created' | 'duty-deleted' | 'connected'
  duty?: any
  dutyId?: number
  timestamp: number
}

interface Duty {
  id: number
  dutyDate: string
  dutyType: string
  notes?: string
  user: {
    id: number
    fullName: string
  }
}

export function useRealTimeDuties() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  const connectToSSE = () => {
    try {
      const eventSource = new EventSource('/api/duties/stream')
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
        console.log('SSE connected')
      }
      
      eventSource.onmessage = (event) => {
        try {
          const update: DutyChangeEvent = JSON.parse(event.data)
          
          switch (update.type) {
            case 'connected':
              console.log('SSE connection confirmed')
              break
              
            case 'duty-updated':
              if (update.duty) {
                updateDutyInAllCaches(queryClient, update.duty)
                console.log('Duty updated via SSE:', update.duty.id)
              }
              break
              
            case 'duty-created':
              if (update.duty) {
                addDutyToAllCaches(queryClient, update.duty)
                console.log('Duty created via SSE:', update.duty.id)
              }
              break
              
            case 'duty-deleted':
              if (update.dutyId) {
                removeDutyFromAllCaches(queryClient, update.dutyId)
                console.log('Duty deleted via SSE:', update.dutyId)
              }
              break
          }
        } catch (error) {
          console.error('Error processing SSE message:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        setIsConnected(false)
        setConnectionError('Connection lost')
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting to SSE (attempt ${reconnectAttempts.current})`)
            connectToSSE()
          }, delay)
        } else {
          setConnectionError('Unable to connect to real-time updates')
        }
      }
    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      setConnectionError('Failed to establish connection')
    }
  }
  
  useEffect(() => {
    connectToSSE()
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])
  
  return { isConnected, connectionError }
}

function updateDutyInAllCaches(queryClient: any, updatedDuty: Duty) {
  // Update paginated admin duties
  queryClient.setQueriesData(
    { queryKey: ['admin-duties'] },
    (old: any) => {
      if (!old?.duties) return old
      return {
        ...old,
        duties: old.duties.map((d: Duty) => 
          d.id === updatedDuty.id ? updatedDuty : d
        )
      }
    }
  )
  
  // Update calendar duties
  queryClient.setQueriesData(
    { queryKey: ['duties'] },
    (old: any) => {
      if (!old?.duties) return old
      return {
        ...old,
        duties: old.duties.map((d: Duty) => 
          d.id === updatedDuty.id ? updatedDuty : d
        )
      }
    }
  )
  
  // Update personal duties
  queryClient.setQueriesData(
    { queryKey: ['my-duties'] },
    (old: any) => {
      if (!old?.duties) return old
      return {
        ...old,
        duties: old.duties.map((d: Duty) => 
          d.id === updatedDuty.id ? updatedDuty : d
        )
      }
    }
  )
  
  // Invalidate dashboard stats for accurate counts
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
}

function addDutyToAllCaches(queryClient: any, newDuty: Duty) {
  // Add to paginated admin duties (first page)
  queryClient.setQueriesData(
    { queryKey: ['admin-duties'] },
    (old: any) => {
      if (!old?.duties) return old
      // Insert at the beginning for newest-first ordering
      return {
        ...old,
        duties: [newDuty, ...old.duties]
      }
    }
  )
  
  // Add to calendar duties
  queryClient.setQueriesData(
    { queryKey: ['duties'] },
    (old: any) => {
      if (!old?.duties) return old
      return {
        ...old,
        duties: [...old.duties, newDuty]
      }
    }
  )
  
  // Add to personal duties if it belongs to the user
  queryClient.setQueriesData(
    { queryKey: ['my-duties'] },
    (old: any) => {
      if (!old?.duties) return old
      return {
        ...old,
        duties: [...old.duties, newDuty]
      }
    }
  )
  
  // Invalidate dashboard stats
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
}

function removeDutyFromAllCaches(queryClient: any, dutyId: number) {
  // Remove from all duty caches
  const cacheKeys = [
    { queryKey: ['admin-duties'] },
    { queryKey: ['duties'] },
    { queryKey: ['my-duties'] }
  ]
  
  cacheKeys.forEach(({ queryKey }) => {
    queryClient.setQueriesData(
      { queryKey },
      (old: any) => {
        if (!old?.duties) return old
        return {
          ...old,
          duties: old.duties.filter((d: Duty) => d.id !== dutyId)
        }
      }
    )
  })
  
  // Invalidate dashboard stats
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
}