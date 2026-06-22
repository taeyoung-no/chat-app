import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Socket, io } from 'socket.io-client'
import type { RootState } from '../store'
import { sendMessageSchema } from '../../../shared/schemas/message'

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
  const socketRef = useRef<Socket>(null)

  useEffect(() => {
    const socket: Socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', id)
    })
    socket.on('connect_error', (err: any) => {
      alert(err.message || '연결 실패')
    })
    socket.on('messages', (data: Message[]) => {
      setMessages(data)
    })
    socket.on('message', (data: Message) => {
      setMessages((prev) => [...prev, data])
    })
    socket.on('error', (err: any) => {
      alert(err.message || '서버 에러인 듯')
    })

    return () => {
      socket.disconnect()
    }
  }, [id, username])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView()
  }, [messages])

  const sendMessage = () => {
    if (!socketRef.current) return

    const result = sendMessageSchema.safeParse({
      roomId: id,
      content: input,
    })
    if (!result.success) {
      alert(result.error.issues[0]?.message || '똑바로 입력하세요')
      return
    }

    socketRef.current.emit('message', result.data)
    setInput('')
  }

  return (
    <main className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 ${username === msg.username ? 'text-right' : 'text-left'}`}
          >
            <div>{msg.username}</div>
            <div className="text-xl">{msg.content}</div>
            <div ref={messageEndRef} />
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 bg-white py-5 flex items-center gap-4">
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
