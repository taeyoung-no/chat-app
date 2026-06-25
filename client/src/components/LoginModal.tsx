import Modal from './Modal'
import { login } from '../api/auth'
import { useMutation } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { setUser } from '../store/slices/authSlice'
import { useForm } from 'react-hook-form'
import { type LoginFormData, loginSchema } from 'shared/schemas/auth'
import { zodResolver } from '@hookform/resolvers/zod'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Credentials {
  username: string
  password: string
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (credentials: Credentials) =>
      login(credentials.username, credentials.password),
    onSuccess: (user) => {
      dispatch(setUser(user))
      reset()
      onClose()
    },
    onError: (err: any) => {
      alert(err.message || '로그인 실패')
    },
  })

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} title="로그인하세요">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1 mb-6">
          <div>
            <h4>이름</h4>
            <input
              type="text"
              {...register('username')}
              className="w-full px-4 py-3 border border-gray-300"
            />
            <div className="min-h-6">
              {errors.username && (
                <p className="text-red-500">{errors.username.message}</p>
              )}
            </div>
          </div>
          <div>
            <h4>비밀번호</h4>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-3 border border-gray-300"
            />
            <div className="min-h-6">
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
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
