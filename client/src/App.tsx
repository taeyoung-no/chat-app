import './App.css'
import { fetchRooms } from './api/rooms'
import { useQuery } from '@tanstack/react-query'
import Navbar from './components/Navbar'
import { useEffect } from 'react'
import { getCurrentUser } from './api/auth'
import { useDispatch } from 'react-redux'
import { setUser } from './store/slices/authSlice'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const user = await getCurrentUser()
        dispatch(setUser(user))
      } catch (err: any) {
        console.error(err.message || '유저 정보 조회 실패')
      }
    }
    checkAuthState()
  }, [])

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
    <div>
      <Navbar />

      {isLoading && <p className="text-center text-2xl">방 불러오는 중...</p>}
      {isError && <p className="text-center text-2xl">{error?.message}</p>}

      <main className="max-w-2xl mx-auto space-y-5 mb-5">
        {rooms.map((room) => (
          <div key={room._id} className="cursor-pointer group">
            <h4 className="text-2xl text-blue-800 group-hover:text-black group-hover:underline">
              {room.name}
            </h4>
          </div>
        ))}
      </main>
    </div>
  )
}

export default App
