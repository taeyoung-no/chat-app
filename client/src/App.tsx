import { useEffect, useState } from 'react'
import './App.css'
import LoginModal from './components/LoginModal'
import CreateRoomModal from './components/CreateRoomModal'
import { fetchRooms, type Room } from './api/rooms'

function App() {
  const API_URL = import.meta.env.VITE_API_URL

  const [rooms, setRooms] = useState<Room[]>([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)

  const loadRooms = async () => {
    try {
      const data = await fetchRooms()
      setRooms(data)
    } catch (err) {
      console.error(`방 목록 불러오기 실패: ${err}`)
    }
  }

  useEffect(() => {
    loadRooms()
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
          loadRooms()
        }}
      />
    </div>
  )
}

export default App
