import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { RootState } from '../store'
import { sendMessageSchema } from 'shared/schemas/message'
import { io } from 'socket.io-client'
import type { Message } from 'shared/schemas/message'

function Room() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoaded, setMessagesLoaded] = useState(false)

  const username = useSelector((state: RootState) => state.auth.user?.username)
  const messageEndRef = useRef<HTMLDivElement>(null)

  const socket = useMemo(() => {
    return io({ path: '/api/socket.io', withCredentials: true, forceNew: true })
  }, [])

  useEffect(() => {
    if (!socket) return

    setMessages([])
    setMessagesLoaded(false)
    socket.emit('join', id)

    socket.on('connect_error', (err: any) => {
      navigate('/')
      alert(err.message || '연결 실패')
    })
    socket.on('messages', (data: Message[]) => {
      setMessages(data)
      setMessagesLoaded(true)
    })
    socket.on('message', (data: Message) => {
      setMessages((prev) => [...prev, data])
    })
    socket.on('error', (err: any) => {
      navigate('/')
      alert(err.message || '서버 에러인 듯')
    })

    return () => {
      socket.off('messages')
      socket.off('message')
      socket.off('error')
      socket.disconnect()
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    }
  }, [socket, id])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView()
  }, [messages])

  const sendMessage = () => {
    if (!socket) return

    const result = sendMessageSchema.safeParse({
      roomId: id,
      content: input,
    })
    if (!result.success) {
      alert(result.error.issues[0]?.message || '똑바로 입력하세요')
      return
    }

    socket.emit('message', result.data)
    setInput('')
  }

  return (
    <main className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {messagesLoaded && messages.length === 0 && <p className="text-center text-2xl">메시지가 없습니다</p>}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${username === msg.username ? 'text-right' : 'text-left'}`}>
            <div>{msg.username}</div>
            <div className="text-xl">{msg.content}</div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      <div className="sticky bottom-0 bg-white py-5 flex items-center gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          maxLength={32}
          className="w-full border border-gray-300 px-4 py-3"
        />
        <button onClick={sendMessage} className="flex-shrink-0 cursor-pointer px-3 py-2 hover:underline">
          전송
        </button>
      </div>
    </main>
  )
}

export default Room
