import { useEffect, useState } from 'react'
import './App.css'

interface Room {
  _id: string
  name: string
  createdAt: string
}

function App() {
  const [rooms, setRooms] = useState<Room[]>([])

  const fetchRooms = async () => {
    try {
      const res = await fetch('http://localhost:8080/room')
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch (err) {
      console.error(`방 목록 불러오기 실패: ${err}`)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  return (
    <div className="max-w-2xl mx-auto pt-5">
      <header className="mb-5">
        <h1 className="text-3xl font-bold text-center">Chat</h1>
      </header>

      <main className="space-y-2">
        {rooms.map((room) => (
          <div key={room._id} className="p-4 border border-gray-300">
            <h4>{room.name}</h4>
          </div>
        ))}
      </main>
    </div>
  )
}

export default App
