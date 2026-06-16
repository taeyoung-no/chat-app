import { useState, type SubmitEventHandler } from 'react'
import Modal from './Modal'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin: SubmitEventHandler<HTMLFormElement> = async (e) => {
    if (e) e.preventDefault() // 새로고침 방지

    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })

      if (res.ok) {
        setUsername('')
        setPassword('')
        onClose()
      } else {
        const errorData = await res.json()
        alert(errorData.message)
      }
    } catch (err) {
      alert(err)
    }
  }

  return (
    <Modal isOpen={isOpen} title="로그인하세요">
      <form onSubmit={handleLogin}>
        <div className="space-y-1 mb-6">
          <div>
            <h4>이름</h4>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300"
            />
          </div>
          <div>
            <h4>비밀번호</h4>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setUsername('')
              setPassword('')
              onClose()
            }}
            className="cursor-pointer px-3 py-2"
          >
            닫기
          </button>
          <button type="submit" className="cursor-pointer px-3 py-2">
            로그인
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default LoginModal
