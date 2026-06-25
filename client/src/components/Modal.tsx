import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  children: ReactNode
}

function Modal({ isOpen, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md p-6">
        <h2 className="text-xl mb-4">{title}</h2>
        <div className="mb-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal
