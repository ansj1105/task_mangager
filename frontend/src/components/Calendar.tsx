import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { eventsApi, Event } from '../api/api'
import './Calendar.css'

interface CalendarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onDateClick: (date: Date) => void
  onEventClick: (event: Event) => void
}

const Calendar = ({ currentDate, onDateChange, onDateClick, onEventClick }: CalendarProps) => {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const loadEvents = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const data = await eventsApi.getAll({ month, year })
      setEvents(data)
    } catch (error) {
      console.error('Failed to load events:', error)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: ko })
  const calendarEnd = endOfWeek(monthEnd, { locale: ko })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)
      return date >= startDate && date <= endDate
    })
  }

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={handlePrevMonth} className="calendar-nav-btn">
            ‹
          </button>
          <button onClick={handleToday} className="calendar-today-btn">
            오늘
          </button>
          <button onClick={handleNextMonth} className="calendar-nav-btn">
            ›
          </button>
          <h2 className="calendar-title">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h2>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((day) => {
            const dayEvents = getEventsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${!isCurrentMonth ? 'calendar-day-other-month' : ''} ${isToday ? 'calendar-day-today' : ''}`}
                onClick={() => onDateClick(day)}
              >
                <div className="calendar-day-number">{format(day, 'd')}</div>
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      style={{ backgroundColor: event.color || '#4285F4' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="calendar-event-more">
                      +{dayEvents.length - 3}개 더
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Calendar

