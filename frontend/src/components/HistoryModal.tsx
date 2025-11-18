import { useState, useEffect } from 'react'
import axios from 'axios'
import './HistoryModal.css'

interface HistoryRecord {
  id: number
  transaction_id: string
  operation_type: 'insert' | 'update' | 'delete'
  table_name: string
  record_id: number
  old_data?: any
  new_data?: any
  status: 'committed' | 'rolled_back'
  created_at: string
}

interface HistoryModalProps {
  tableName: string
  recordId: number | null
  onClose: () => void
}

const HistoryModal = ({ tableName, recordId, onClose }: HistoryModalProps) => {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [tableName, recordId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      let url = '/api/history'
      
      if (recordId !== null) {
        url = `/api/history/${tableName}/${recordId}`
      } else {
        url = `/api/history/table/${tableName}?limit=100`
      }

      const response = await axios.get(url)
      setHistory(response.data)
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('수정 이력을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getOperationLabel = (type: string) => {
    switch (type) {
      case 'insert':
        return '생성'
      case 'update':
        return '수정'
      case 'delete':
        return '삭제'
      default:
        return type
    }
  }

  const getStatusLabel = (status: string) => {
    return status === 'committed' ? '완료' : '롤백'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>수정 이력</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="history-content">
          {loading ? (
            <div className="history-loading">로딩 중...</div>
          ) : history.length === 0 ? (
            <div className="history-empty">수정 이력이 없습니다.</div>
          ) : (
            <div className="history-list">
              {history.map((record) => (
                <div key={record.id} className="history-item">
                  <div className="history-item-header">
                    <span className={`history-operation history-operation-${record.operation_type}`}>
                      {getOperationLabel(record.operation_type)}
                    </span>
                    <span className={`history-status history-status-${record.status}`}>
                      {getStatusLabel(record.status)}
                    </span>
                    <span className="history-date">{formatDate(record.created_at)}</span>
                  </div>
                  
                  {record.old_data && (
                    <div className="history-diff">
                      <div className="history-diff-section">
                        <div className="history-diff-label">이전 데이터:</div>
                        <pre className="history-diff-old">
                          {JSON.stringify(record.old_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {record.new_data && (
                    <div className="history-diff">
                      <div className="history-diff-section">
                        <div className="history-diff-label">변경 데이터:</div>
                        <pre className="history-diff-new">
                          {JSON.stringify(record.new_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {record.old_data && record.new_data && (
                    <div className="history-diff-combined">
                      <div className="history-diff-section">
                        <div className="history-diff-label">변경 사항:</div>
                        <div className="history-changes">
                          {Object.keys(record.new_data).map((key) => {
                            const oldValue = record.old_data[key]
                            const newValue = record.new_data[key]
                            
                            if (oldValue !== newValue) {
                              return (
                                <div key={key} className="history-change-item">
                                  <span className="history-change-key">{key}:</span>
                                  <span className="history-change-old">{String(oldValue)}</span>
                                  <span className="history-change-arrow">→</span>
                                  <span className="history-change-new">{String(newValue)}</span>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default HistoryModal

