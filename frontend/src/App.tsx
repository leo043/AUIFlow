import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Layout, AlertCircle, Loader2 } from 'lucide-react'
import './App.css'
import { UIRenderer } from './engine/ui-renderer'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

function App() {
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [generatedUI, setGeneratedUI] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate UI')
      }

      const data = await res.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.message || 'UI已生成',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setGeneratedUI(data.uiCode)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成UI时出错，请稍后重试'
      setError(errorMessage)

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: errorMessage,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorBotMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={28} color="#667eea" />
          <h1>AUIFlow</h1>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(102, 126, 234, 0.7)', fontWeight: 500 }}>
          动态GUI生成系统
        </div>
      </header>
      <main className="app-main">
        <div className="chat-section">
          <div className="message-list" ref={messageListRef}>
            {messages.length === 0 && (
              <div className="empty-preview" style={{ minHeight: '200px' }}>
                <Sparkles size={48} />
                <p>输入您的需求，例如：创建一个登录表单</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type === 'user' ? 'user-message' : 'bot-message'}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message">
                <div className="loading-spinner">
                  <Loader2 size={18} className="spinner" />
                  <span>正在生成UI...</span>
                </div>
              </div>
            )}
          </div>
          <div className="message-input">
            <input
              type="text"
              placeholder="输入您的需求，例如：创建一个登录表单"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading || !message.trim()}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>生成中</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>发送</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="ui-preview">
          <div className="ui-preview-header">
            <h2>
              <Layout size={20} />
              生成的UI预览
            </h2>
          </div>
          <div className="preview-container">
            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
            {generatedUI ? (
              <UIRenderer
                html={generatedUI}
                className="generated-ui"
                sandbox={true}
                onRender={(success, errors) => {
                  if (!success && errors) {
                    console.error('UI渲染失败:', errors)
                  }
                }}
                onError={(error) => {
                  console.error('UI渲染错误:', error)
                }}
              />
            ) : (
              <div className="empty-preview">
                <Layout size={64} />
                <p>输入需求后，这里将显示生成的UI预览</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
