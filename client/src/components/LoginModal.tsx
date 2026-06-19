import { useState } from 'react'
import Modal from './Modal'
import { login } from '../api/auth'
import { useMutation } from '@tanstack/react-query'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: () => {
      setUsername('')
      setPassword('')
      onClose()
    },
    onError: (err: any) => {
      alert(err.message || '로그인 실패')
    },
  })

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault() // 새로고침 방지
    mutation.mutate()
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
            className="cursor-pointer px-3 py-2 hover:underline"
          >
            닫기
          </button>
          <button
            type="submit"
            className="cursor-pointer px-3 py-2 hover:underline"
          >
            로그인
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default LoginModal
