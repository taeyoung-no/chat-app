import { useQuery } from '@tanstack/react-query'
import { fetchRooms } from '../api/rooms'
import { Link } from 'react-router-dom'

function List() {
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
    <main>
      {isLoading && <p className="text-center text-2xl">방 불러오는 중...</p>}
      {isError && <p className="text-center text-2xl">{error?.message}</p>}

      <div className="max-w-2xl mx-auto space-y-5 mb-5">
        {rooms.map((room) => (
          <Link
            key={room._id}
            to={`/room/${room._id}`}
            className="cursor-pointer group"
          >
            <h4 className="text-2xl text-blue-800 group-hover:text-black group-hover:underline">
              {room.name}
            </h4>
          </Link>
        ))}
      </div>
    </main>
  )
}

export default List
