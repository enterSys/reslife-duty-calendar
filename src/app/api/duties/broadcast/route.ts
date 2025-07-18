import { NextRequest, NextResponse } from 'next/server'
import { emitDutyUpdated, emitDutyCreated, emitDutyDeleted } from '@/lib/duty-events'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, duty, dutyId } = body
    
    switch (type) {
      case 'duty-updated':
        if (!duty) {
          return NextResponse.json({ error: 'Duty data required for update' }, { status: 400 })
        }
        emitDutyUpdated(duty)
        break
        
      case 'duty-created':
        if (!duty) {
          return NextResponse.json({ error: 'Duty data required for creation' }, { status: 400 })
        }
        emitDutyCreated(duty)
        break
        
      case 'duty-deleted':
        if (!dutyId) {
          return NextResponse.json({ error: 'Duty ID required for deletion' }, { status: 400 })
        }
        emitDutyDeleted(dutyId)
        break
        
      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, type })
  } catch (error) {
    console.error('Broadcast error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}