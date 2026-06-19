import { useState } from 'react'
import './App.css'
import LoginModal from './components/LoginModal'
import CreateRoomModal from './components/CreateRoomModal'
import { fetchRooms } from './api/rooms'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import type { RootState } from './store'

function App() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)

  const {
    data: rooms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  })

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

          {!user ? (
            <button
              onClick={() => setShowLoginModal(true)}
              className="cursor-pointer hover:underline"
            >
              로그인
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span>{user.username}님</span>
              <button
                onClick={() => setShowLoginModal(true)}
                className="cursor-pointer hover:underline"
              >
                로그아웃
              </button>
            </div>
          )}
        </nav>
      </header>

      {isLoading && <p className="text-center text-2xl">방 불러오는 중...</p>}
      {isError && <p className="text-center text-2xl">{error?.message}</p>}

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
        onClose={() => setShowCreateRoomModal(false)}
      />
    </div>
  )
}

export default App
