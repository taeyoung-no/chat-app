import './App.css'
import Navbar from './components/Navbar'
import { useEffect } from 'react'
import { getCurrentUser } from './api/auth'
import { useDispatch } from 'react-redux'
import { setUser } from './store/slices/authSlice'
import List from './components/List'
import { Route, Routes } from 'react-router-dom'
import Room from './components/Room'
import { useSocket } from './contexts/SocketContext'
import { useQueryClient } from '@tanstack/react-query'

function App() {
  const dispatch = useDispatch()
  const socket = useSocket()
  const queryClient = useQueryClient()

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

  useEffect(() => {
    if (!socket) return
    socket.on('create', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })
    socket.on('delete', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })
    return () => {
      socket.off('create')
      socket.off('delete')
    }
  }, [socket, queryClient])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<List />} />
          <Route path="/room/:id" element={<Room />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
