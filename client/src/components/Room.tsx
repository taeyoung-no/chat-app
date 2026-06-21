import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Socket, io } from 'socket.io-client'
import type { RootState } from '../store'

interface Message {
  roomId: string
  username: string
  content: string
}

function Room() {
  const { id } = useParams()
  const [input, setInput] = useState('')

  const username = useSelector((state: RootState) => state.auth.user?.username)

  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_API_URL)
    socket.emit('join', id)
    socket.on('message', (data: Message) => {
      console.log(`${data.username} >> ${data.content}`)
    })

    return () => {
      socket.disconnect()
    }
  }, [id, username])

  const sendMessage = () => {
    if (!input.trim()) return
    const socket: Socket = io(import.meta.env.VITE_API_URL)
    socket.emit('message', {
      roomId: id,
      username,
      content: input.trim(),
    })
    setInput('')
  }

  return (
    <main className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          className="w-full border border-gray-300 px-4 py-3"
        />
        <button
          onClick={sendMessage}
          className="flex-shrink-0 cursor-pointer px-3 py-2 hover:underline"
        >
          전송
        </button>
      </div>
    </main>
  )
}

export default Room
