import { useEffect, useState } from 'react'
import './App.css'
import LoginModal from './components/LoginModal'

interface Room {
  _id: string
  name: string
  createdAt: string
}

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [showLoginModal, setShowLoginModal] = useState(false)

  const fetchRooms = async () => {
    try {
      const res = await fetch('http://localhost:8080/room')
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch (err) {
      console.error(`방 목록 불러오기 실패: ${err}`)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  return (
    <div>
      <header className="border-b border-gray-200 mb-5">
        <nav className="max-w-2xl mx-auto py-4 flex items-center justify-between">
          <span className="text-2xl">Open Chatting</span>

          <button
            onClick={() => setShowLoginModal(true)}
            className="cursor-pointer"
          >
            로그인
          </button>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto space-y-2">
        {rooms.map((room) => (
          <div key={room._id} className="p-4 border border-gray-300">
            <h4>{room.name}</h4>
          </div>
        ))}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}

export default App
