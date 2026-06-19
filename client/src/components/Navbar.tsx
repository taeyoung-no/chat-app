import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useState } from 'react'
import LoginModal from './LoginModal'
import CreateRoomModal from './CreateRoomModal'
import { useMutation } from '@tanstack/react-query'
import { logout } from '../api/auth'
import { setUser } from '../store/slices/authSlice'

function Navbar() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      dispatch(setUser(null))
    },
    onError: (err: any) => {
      alert(err.message || '로그아웃 실패')
    },
  })

  return (
    <>
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
                onClick={() => mutation.mutate()}
                className="cursor-pointer hover:underline"
              >
                로그아웃
              </button>
            </div>
          )}
        </nav>
      </header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
      />
    </>
  )
}

export default Navbar
