import { useState, useEffect } from 'react'
import { tasksApi, Task } from '../api/api'
import { format } from 'date-fns'
import './TaskModal.css'

interface TaskModalProps {
  task: Task | null
  onClose: () => void
}

const TaskModal = ({ task, onClose }: TaskModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    completed: false,
    due_date: '',
    start_time: '',
    end_time: '',
    priority: 0,
    created_by: '',
    updated_by: '',
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        completed: task.completed || false,
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        priority: task.priority || 0,
        created_by: task.created_by || '',
        updated_by: task.updated_by || '',
      })
    } else {
      // 새 할일 생성 시 created_by 초기화
      setFormData(prev => ({ ...prev, created_by: '', updated_by: '' }))
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const taskData = {
        ...formData,
        due_date: formData.due_date || undefined,
      }

      if (task?.id) {
        await tasksApi.update(task.id, taskData)
      } else {
        await tasksApi.create(taskData as Omit<Task, 'id'>)
      }

      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Failed to save task:', error)
      alert('할일 저장에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!task?.id) return

    if (!confirm('이 할일을 삭제하시겠습니까?')) return

    try {
      await tasksApi.delete(task.id)
      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('할일 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? '할일 수정' : '할일 추가'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>마감일</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>시작 시간</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>종료 시간</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>우선순위</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            >
              <option value={0}>낮음</option>
              <option value={1}>보통</option>
              <option value={2}>높음</option>
            </select>
          </div>

          <div className="form-group">
            <label>작성자 *</label>
            <input
              type="text"
              value={formData.created_by}
              onChange={(e) => setFormData({ ...formData, created_by: e.target.value, updated_by: e.target.value })}
              placeholder="작성자 이름을 입력하세요"
              required
            />
          </div>

          {task && (
            <div className="form-group">
              <label>수정자</label>
              <input
                type="text"
                value={formData.updated_by}
                onChange={(e) => setFormData({ ...formData, updated_by: e.target.value })}
                placeholder="수정자 이름을 입력하세요"
              />
            </div>
          )}

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.completed}
                onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
              />
              완료
            </label>
          </div>

          <div className="form-actions">
            {task && (
              <button type="button" className="btn btn-secondary" onClick={handleDelete}>
                삭제
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal

