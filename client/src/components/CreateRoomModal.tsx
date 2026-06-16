import { useState, type SubmitEventHandler } from 'react'
import Modal from './Modal'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState('')

  const handleCreate: SubmitEventHandler<HTMLFormElement> = async (e) => {
    if (e) e.preventDefault()

    try {
      const res = await fetch('http://localhost:8080/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      })

      if (res.ok) {
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
    <Modal isOpen={isOpen} title="방 생성">
      <form onSubmit={handleCreate}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-3 py-2"
          >
            닫기
          </button>
          <button type="submit" className="cursor-pointer px-3 py-2">
            확인
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateRoomModal
