import { useState, useEffect } from 'react'
import { eventsApi, Event } from '../api/api'
import { format } from 'date-fns'
import './EventModal.css'

interface EventModalProps {
  event: Event | null
  selectedDate: Date | null
  onClose: () => void
}

const EventModal = ({ event, selectedDate, onClose }: EventModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_date: selectedDate ? format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm") : format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    all_day: false,
    location: '',
    color: '#4285F4',
  })

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: event.start_date ? format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm") : '',
        end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
        all_day: event.all_day || false,
        location: event.location || '',
        color: event.color || '#4285F4',
      })
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        start_date: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
        end_date: format(new Date(selectedDate.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      }))
    }
  }, [event, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const eventData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      }

      if (event?.id) {
        await eventsApi.update(event.id, eventData)
      } else {
        await eventsApi.create(eventData as Omit<Event, 'id'>)
      }

      onClose()
      window.location.reload() // 간단한 새로고침
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('일정 저장에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!event?.id) return

    if (!confirm('이 일정을 삭제하시겠습니까?')) return

    try {
      await eventsApi.delete(event.id)
      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('일정 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? '일정 수정' : '일정 추가'}</h2>
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
            <label>
              <input
                type="checkbox"
                checked={formData.all_day}
                onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
              />
              하루 종일
            </label>
          </div>

          <div className="form-group">
            <label>시작 일시 *</label>
            <input
              type={formData.all_day ? 'date' : 'datetime-local'}
              value={formData.all_day ? formData.start_date.split('T')[0] : formData.start_date}
              onChange={(e) => {
                const value = formData.all_day ? `${e.target.value}T00:00` : e.target.value
                setFormData({ ...formData, start_date: value })
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>종료 일시 *</label>
            <input
              type={formData.all_day ? 'date' : 'datetime-local'}
              value={formData.all_day ? formData.end_date.split('T')[0] : formData.end_date}
              onChange={(e) => {
                const value = formData.all_day ? `${e.target.value}T23:59` : e.target.value
                setFormData({ ...formData, end_date: value })
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>장소</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>색상</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="form-actions">
            {event && (
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

export default EventModal

