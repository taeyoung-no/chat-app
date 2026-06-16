import { useEffect, useState } from 'react'
import './App.css'
import LoginModal from './components/LoginModal'
import CreateRoomModal from './components/CreateRoomModal'

interface Room {
  _id: string
  name: string
  createdAt: string
}

function App() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)

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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl">Open Chatting</h1>
            <div className="flex items-center gap-2">
              <button className="cursor-pointer hover:underline">목록</button>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="cursor-pointer hover:underline"
              >
                생성
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowLoginModal(true)}
            className="cursor-pointer hover:underline"
          >
            로그인
          </button>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto space-y-5">
        {rooms.map((room) => (
          <div key={room._id} className="cursor-pointer group">
            <h4 className="text-2xl text-blue-800 group-hover:text-black group-hover:underline">
              {room.name}
            </h4>
          </div>
        ))}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => {
          setShowCreateRoomModal(false)
          fetchRooms()
        }}
      />
    </div>
  )
}

export default App
