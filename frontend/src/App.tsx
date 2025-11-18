import { useState } from 'react'
import Calendar from './components/Calendar'
import TaskList from './components/TaskList'
import EventModal from './components/EventModal'
import TaskModal from './components/TaskModal'
import HistoryModal from './components/HistoryModal'
import './App.css'

export interface Task {
  id?: number
  user_id: number
  title: string
  description?: string
  completed?: boolean
  due_date?: string
  start_time?: string
  end_time?: string
  priority?: number
  created_by?: string
  updated_by?: string
}

export interface Event {
  id?: number
  user_id: number
  title: string
  description?: string
  start_date: string
  end_date: string
  all_day?: boolean
  location?: string
  color?: string
}

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [historyTableName, setHistoryTableName] = useState<string>('tasks')
  const [historyRecordId, setHistoryRecordId] = useState<number | null>(null)

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowEventModal(true)
  }

  const handleCreateTask = () => {
    setEditingTask(null)
    setShowTaskModal(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const handleCreateEvent = (date?: Date) => {
    setEditingEvent(null)
    if (date) {
      setSelectedDate(date)
    }
    setShowEventModal(true)
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setSelectedDate(new Date(event.start_date))
    setShowEventModal(true)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Check</h1>
        <div className="header-actions">
          <button onClick={handleCreateTask} className="btn btn-primary">
            할일 추가
          </button>
          <button onClick={() => handleCreateEvent()} className="btn btn-primary">
            일정 추가
          </button>
        </div>
      </header>

      <div className="app-content">
        <div className="sidebar">
          <TaskList
            onTaskClick={handleEditTask}
            onCreateTask={handleCreateTask}
            onHistoryClick={(taskId) => {
              setHistoryTableName('tasks')
              setHistoryRecordId(taskId)
              setShowHistoryModal(true)
            }}
          />
        </div>

        <div className="main-content">
          <Calendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onDateClick={handleDateClick}
            onEventClick={handleEditEvent}
          />
        </div>
      </div>

      {showEventModal && (
        <EventModal
          event={editingEvent}
          selectedDate={selectedDate}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
            setSelectedDate(null)
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false)
            setEditingTask(null)
          }}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          tableName={historyTableName}
          recordId={historyRecordId}
          onClose={() => {
            setShowHistoryModal(false)
            setHistoryRecordId(null)
          }}
        />
      )}
    </div>
  )
}

export default App

