import { useEffect } from 'react'
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { deleteRoom, fetchRooms } from '../api/rooms'
import { Link } from 'react-router-dom'

import { useSelector } from 'react-redux'
import type { RootState } from '../store'

function List() {
  const user = useSelector((state: RootState) => state.auth.user)
  const queryClient = useQueryClient()

  const baseUrl = import.meta.env.VITE_API_URL || 'https://localhost:8443'

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/stream/rooms`)

    es.addEventListener('create', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })
    es.addEventListener('delete', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })

    es.onerror = (err) => {
      console.warn(`[SSE] ${err}`)
    }

    return () => {
      es.close()
    }
  }, [baseUrl, queryClient])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['rooms'],
    queryFn: ({ pageParam }) => fetchRooms({ page: pageParam }),
    getNextPageParam: (lastPage, allPages) => (lastPage.length === 20 ? allPages.length + 1 : undefined),
    initialPageParam: 1,
  })
  const rooms = data?.pages.flat() ?? []

  const deleteMutation = useMutation({
    mutationFn: (roomId: string) => deleteRoom(roomId),
    onError: (err: any) => {
      alert(err.message || '방 삭제 실패')
    },
  })

  const handleDelete = (roomId: string) => {
    deleteMutation.mutate(roomId)
  }

  return (
    <main>
      {isLoading && <p className="text-center text-2xl">방 불러오는 중...</p>}
      {isError && <p className="text-center text-2xl">{error?.message}</p>}
      {!isLoading && !isError && rooms.length === 0 && <p className="text-center text-2xl">방이 없습니다</p>}

      <div className="max-w-2xl mx-auto space-y-5 mb-5">
        {rooms.map((room) => (
          <div key={room._id} className="flex items-center">
            <Link to={`/room/${room._id}`} className="flex-1 block cursor-pointer group">
              <h4 className="text-2xl text-blue-800 group-hover:text-black group-hover:underline">{room.name}</h4>
            </Link>
            {room.username === user?.username && (
              <button onClick={() => handleDelete(room._id)} className="cursor-pointer hover:underline">
                삭제
              </button>
            )}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="max-w-2xl mx-auto text-center mt-2 mb-5">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className={`${isFetchingNextPage ? '' : 'cursor-pointer hover:underline'}`}
          >
            {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}
    </main>
  )
}

export default List
