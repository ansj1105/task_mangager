import { useState, useEffect } from 'react'
import { tasksApi, Task } from '../api/api'
import './TaskList.css'

interface TaskListProps {
  onTaskClick: (task: Task) => void
  onCreateTask: () => void
  onHistoryClick?: (taskId: number) => void
}

const TaskList = ({ onTaskClick, onCreateTask, onHistoryClick }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    loadTasks()
  }, [filter])

  const loadTasks = async () => {
    try {
      const filters: any = {}
      if (filter === 'active') {
        filters.completed = false
      } else if (filter === 'completed') {
        filters.completed = true
      }
      const data = await tasksApi.getAll(filters)
      setTasks(data)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const handleToggleTask = async (task: Task) => {
    try {
      if (task.id) {
        await tasksApi.update(task.id, { completed: !task.completed })
        loadTasks()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 2:
        return '#ea4335'
      case 1:
        return '#fbbc04'
      default:
        return '#34a853'
    }
  }

  const getPriorityLabel = (priority?: number) => {
    switch (priority) {
      case 2:
        return '높음'
      case 1:
        return '보통'
      default:
        return '낮음'
    }
  }

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2>할일</h2>
        <button onClick={onCreateTask} className="task-add-btn">
          +
        </button>
      </div>

      <div className="task-list-filters">
        <button
          className={`task-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          className={`task-filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          진행중
        </button>
        <button
          className={`task-filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          완료
        </button>
      </div>

      <div className="task-list-items">
        {tasks.length === 0 ? (
          <div className="task-empty">할일이 없습니다.</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''}`}
              onClick={() => onTaskClick(task)}
            >
              <div className="task-item-header">
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => handleToggleTask(task)}
                  onClick={(e) => e.stopPropagation()}
                  className="task-checkbox"
                />
                <span className="task-title">{task.title}</span>
                {task.priority !== undefined && task.priority > 0 && (
                  <span
                    className="task-priority"
                    style={{ color: getPriorityColor(task.priority) }}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                )}
              </div>
              {task.description && (
                <div className="task-description">{task.description}</div>
              )}
              {task.due_date && (
                <div className="task-due-date">
                  📅 {new Date(task.due_date).toLocaleDateString('ko-KR')}
                </div>
              )}
              <div className="task-item-footer">
                {task.created_by && (
                  <div className="task-author">
                    작성자: {task.created_by}
                    {task.updated_by && task.updated_by !== task.created_by && (
                      <span className="task-updater"> | 수정자: {task.updated_by}</span>
                    )}
                  </div>
                )}
                {task.id && onHistoryClick && (
                  <button
                    className="task-history-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onHistoryClick(task.id!)
                    }}
                    title="수정 이력 보기"
                  >
                    📝 이력
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TaskList

