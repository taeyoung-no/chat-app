import { useEffect, useRef, useState } from 'react'
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
  const [messages, setMessages] = useState<Message[]>([])

  const username = useSelector((state: RootState) => state.auth.user?.username)
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_API_URL)
    socket.emit('join', id)
    socket.on('message', (data: Message) => {
      setMessages((prev) => [...prev, data])
    })

    return () => {
      socket.disconnect()
    }
  }, [id, username])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView()
  }, [messages])

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
    <main className="max-w-2xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-5">
        {messages.map((msg, i) => (
          <div key={i} className="mb-3">
            <div>{msg.username}</div>
            <div className="text-xl">{msg.content}</div>
            <div ref={messageEndRef} />
          </div>
        ))}
      </div>
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
