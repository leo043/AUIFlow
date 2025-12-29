import { useState } from 'react'
import './App.css'
import { UIRenderer } from './engine/ui-renderer'
import { apiService } from './core/api'

function App() {
  const [message, setMessage] = useState<string>('')
  const [response, setResponse] = useState<string>('')
  const [generatedUI, setGeneratedUI] = useState<string>('')

  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      const res = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate UI')
      }

      const data = await res.json()
      setResponse(data.message)
      setGeneratedUI(data.uiCode)
    } catch (error) {
      console.error('Error generating UI:', error)
      setResponse('生成UI时出错，请稍后重试')
    }

    setMessage('')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AUIFlow - 动态GUI生成系统</h1>
      </header>
      <main className="app-main">
        <div className="chat-section">
          <div className="message-list">
            {response && (
              <div className="message bot-message">
                <div className="message-content">{response}</div>
              </div>
            )}
          </div>
          <div className="message-input">
            <input
              type="text"
              placeholder="输入您的需求，例如：创建一个登录表单"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>发送</button>
          </div>
        </div>
        <div className="ui-preview">
          <h2>生成的UI预览</h2>
          <div className="preview-container">
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