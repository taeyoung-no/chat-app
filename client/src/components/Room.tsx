import { useEffect, useState } from 'react'
import { Socket, io } from 'socket.io-client'

const socket: Socket = io(import.meta.env.VITE_API_URL)

function Room() {
  const [input, setInput] = useState('')

  useEffect(() => {
    socket.on('message', (msg: string) => {
      console.log(`server >> ${msg}`)
    })
    return () => {
      socket.off('message')
    }
  }, [])

  const sendMessage = () => {
    if (!input.trim()) return
    socket.emit('message', input.trim())
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
