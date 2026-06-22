import Modal from './Modal'
import { createRoom } from '../api/rooms'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { type CreateRoomFormData, createRoomSchema } from '../../../shared/schemas/room'
import { zodResolver } from '@hookform/resolvers/zod'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: '' },
  })

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      reset()
      onClose()
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (err: any) => {
      alert(err.message || '방 생성 실패')
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (data: CreateRoomFormData) => {
    mutation.mutate(data.name)
  }

  return (
    <Modal isOpen={isOpen} title="방 생성">
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          {...register('name')}
          className="w-full px-4 py-3 border border-gray-300"
        />
        <div className="min-h-6">
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
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
            확인
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateRoomModal
