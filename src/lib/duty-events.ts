import { EventEmitter } from 'events'

export interface DutyChangeEvent {
  type: 'duty-updated' | 'duty-created' | 'duty-deleted'
  duty?: any
  dutyId?: number
  userId?: string
  timestamp: number
}

export interface EditorEvent {
  type: 'start-editing' | 'stop-editing'
  dutyId: number
  editor: string
  timestamp: number
}

// Global event emitter for duty changes
export const dutyChangeEmitter = new EventEmitter()

// Global event emitter for editor activity
export const editorActivityEmitter = new EventEmitter()

// Helper functions to emit events
export function emitDutyUpdated(duty: any) {
  const event: DutyChangeEvent = {
    type: 'duty-updated',
    duty,
    timestamp: Date.now()
  }
  dutyChangeEmitter.emit('duty-updated', event)
}

export function emitDutyCreated(duty: any) {
  const event: DutyChangeEvent = {
    type: 'duty-created',
    duty,
    timestamp: Date.now()
  }
  dutyChangeEmitter.emit('duty-created', event)
}

export function emitDutyDeleted(dutyId: number) {
  const event: DutyChangeEvent = {
    type: 'duty-deleted',
    dutyId,
    timestamp: Date.now()
  }
  dutyChangeEmitter.emit('duty-deleted', event)
}

export function emitEditorActivity(type: 'start-editing' | 'stop-editing', dutyId: number, editor: string) {
  const event: EditorEvent = {
    type,
    dutyId,
    editor,
    timestamp: Date.now()
  }
  editorActivityEmitter.emit(type, event)
}