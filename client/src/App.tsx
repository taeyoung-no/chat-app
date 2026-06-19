import { useState } from 'react'
import './App.css'
import LoginModal from './components/LoginModal'
import CreateRoomModal from './components/CreateRoomModal'
import { fetchRooms } from './api/rooms'
import { useQuery } from '@tanstack/react-query'

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)

  const {
    data: rooms = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  })

  if (isLoading) return <div>방 불러오는 중...</div>
  if (isError) return <div>{error?.message}</div>
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
          refetch()
        }}
      />
    </div>
  )
}

export default App
