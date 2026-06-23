import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteRoom, fetchRooms } from '../api/rooms'
import { Link } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import { useEffect } from 'react'

function List() {
  const socket = useSocket()
  const queryClient = useQueryClient()

  const {
    data: rooms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  })

  const deleteMutation = useMutation({
    mutationFn: (roomId: string) => deleteRoom(roomId),
    onError: (err: any) => {
      alert(err.message || '방 삭제 실패')
    },
  })

  const handleDelete = (roomId: string) => {
    deleteMutation.mutate(roomId)
  }

  useEffect(() => {
    if (!socket) return
    socket.on('joined', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })
    socket.on('delete', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })
    return () => {
      socket.off('joined')
      socket.off('delete')
    }
  }, [socket, queryClient])

  return (
    <main>
      {isLoading && <p className="text-center text-2xl">방 불러오는 중...</p>}
      {isError && <p className="text-center text-2xl">{error?.message}</p>}

      <div className="max-w-2xl mx-auto space-y-5 mb-5">
        {rooms.map((room) => (
          <div key={room._id} className="flex items-center">
            <Link
              to={`/room/${room._id}`}
              className="flex-1 block cursor-pointer group"
            >
              <h4 className="text-2xl text-blue-800 group-hover:text-black group-hover:underline">
                {room.name}
              </h4>
            </Link>
            <button
              onClick={() => handleDelete(room._id)}
              className="hover:underline"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

export default List
