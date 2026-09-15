import { io, Socket } from 'socket.io-client'

export interface CheckinUpdate {
  attendeeId: string
  fullName: string
  status: string
  checkIn?: { checkInAt?: string; gate?: string }
  gate?: string
}

const socket: Socket = io('http://localhost:5000', {
  autoConnect: false,
  withCredentials: true,
})

export function joinEvent(eventId: string, onCheckin: (update: CheckinUpdate) => void) {
  socket.connect()
  socket.emit('event:join', eventId)
  socket.on('checkin:new', onCheckin)

  return () => {
    socket.emit('event:leave', eventId)
    socket.off('checkin:new', onCheckin)
    socket.disconnect()
  }
}
