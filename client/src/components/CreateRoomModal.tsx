import { useState } from 'react'
import Modal from './Modal'
import { createRoom } from '../api/rooms'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      setName('')
      onClose()
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (err: any) => {
      alert(err.message || '방 생성 실패')
    },
  })

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutation.mutate(name)
  }

  return (
    <Modal isOpen={isOpen} title="방 생성">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setName('')
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
            확인
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateRoomModal
