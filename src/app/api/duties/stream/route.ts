import { NextRequest } from 'next/server'
import { dutyChangeEmitter, DutyChangeEvent } from '@/lib/duty-events'

// Keep track of active SSE connections
const activeConnections = new Set<ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  // Check if client accepts text/event-stream
  const acceptHeader = request.headers.get('accept')
  if (!acceptHeader?.includes('text/event-stream')) {
    return new Response('This endpoint only supports Server-Sent Events', { status: 400 })
  }

  let controller: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
      activeConnections.add(controller)
      
      const encoder = new TextEncoder()
      
      // Send initial connection confirmation
      controller.enqueue(encoder.encode('data: {"type":"connected","timestamp":' + Date.now() + '}\n\n'))
      
      // Set up event listeners
      const handleDutyUpdate = (event: DutyChangeEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch (error) {
          console.error('Error sending SSE update:', error)
        }
      }
      
      // Listen for all duty change events
      dutyChangeEmitter.on('duty-updated', handleDutyUpdate)
      dutyChangeEmitter.on('duty-created', handleDutyUpdate)
      dutyChangeEmitter.on('duty-deleted', handleDutyUpdate)
      
      // Store cleanup function
      ;(controller as any).cleanup = () => {
        dutyChangeEmitter.off('duty-updated', handleDutyUpdate)
        dutyChangeEmitter.off('duty-created', handleDutyUpdate)
        dutyChangeEmitter.off('duty-deleted', handleDutyUpdate)
        activeConnections.delete(controller)
      }
    },
    
    cancel() {
      if (controller && (controller as any).cleanup) {
        ;(controller as any).cleanup()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Helper function to get active connection count (not exported in Next.js API route)
function getActiveConnectionCount() {
  return activeConnections.size
}