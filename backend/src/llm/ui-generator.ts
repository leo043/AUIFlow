import { openai, openaiConfig } from './openai.js'
import { sanitizeHtml } from '../security/sanitizer.js'

// 模拟数据，用于演示
const MOCK_RESPONSES = {
  '登录表单': {
    explanation: '这是一个简单的登录表单',
    html: `<!DOCTYPE html>
<html>
<head>
<style>
.login-form {
  width: 300px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.login-form h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #2196f3;
}

.login-btn {
  width: 100%;
  padding: 10px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.login-btn:hover {
  background-color: #0b7dda;
}
</style>
</head>
<body>
<div class="login-form">
  <h2>用户登录</h2>
  <form onsubmit="alert('登录成功！'); return false;">
    <div class="form-group">
      <label for="username">用户名</label>
      <input type="text" id="username" name="username" placeholder="请输入用户名" required>
    </div>
    <div class="form-group">
      <label for="password">密码</label>
      <input type="password" id="password" name="password" placeholder="请输入密码" required>
    </div>
    <button type="submit" class="login-btn">登录</button>
  </form>
</div>
</body>
</html>`
  },
  '计算器': {
    explanation: '这是一个简单的计算器',
    html: `<!DOCTYPE html>
<html>
<head>
<style>
.calculator {
  width: 250px;
  margin: 100px auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.display {
  padding: 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  text-align: right;
}

.display input {
  width: 100%;
  border: none;
  font-size: 24px;
  text-align: right;
  background-color: transparent;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background-color: #ddd;
}

.btn {
  padding: 20px;
  border: none;
  font-size: 18px;
  cursor: pointer;
  background-color: white;
}

.btn:hover {
  background-color: #f0f0f0;
}

.btn.operator {
  background-color: #ff9500;
  color: white;
}

.btn.operator:hover {
  background-color: #ff8c00;
}

.btn.clear {
  background-color: #ff3b30;
  color: white;
  grid-column: span 2;
}

.btn.clear:hover {
  background-color: #ff2d20;
}

.btn.equals {
  background-color: #34c759;
  color: white;
  grid-column: span 2;
}

.btn.equals:hover {
  background-color: #30b759;
}
</style>
</head>
<body>
<div class="calculator">
  <div class="display">
    <input type="text" id="result" readonly>
  </div>
  <div class="buttons">
    <button class="btn clear" onclick="clearResult()">C</button>
    <button class="btn operator" onclick="appendToResult('/')">/</button>
    <button class="btn" onclick="appendToResult('7')">7</button>
    <button class="btn" onclick="appendToResult('8')">8</button>
    <button class="btn" onclick="appendToResult('9')">9</button>
    <button class="btn operator" onclick="appendToResult('*')">*</button>
    <button class="btn" onclick="appendToResult('4')">4</button>
    <button class="btn" onclick="appendToResult('5')">5</button>
    <button class="btn" onclick="appendToResult('6')">6</button>
    <button class="btn operator" onclick="appendToResult('-')">-</button>
    <button class="btn" onclick="appendToResult('1')">1</button>
    <button class="btn" onclick="appendToResult('2')">2</button>
    <button class="btn" onclick="appendToResult('3')">3</button>
    <button class="btn operator" onclick="appendToResult('+')">+</button>
    <button class="btn" onclick="appendToResult('0')">0</button>
    <button class="btn" onclick="appendToResult('.')">.</button>
    <button class="btn equals" onclick="calculate()">=</button>
  </div>
</div>

<script>
function appendToResult(value) {
  document.getElementById('result').value += value;
}

function clearResult() {
  document.getElementById('result').value = '';
}

function calculate() {
  try {
    const result = eval(document.getElementById('result').value);
    document.getElementById('result').value = result;
  } catch (error) {
    document.getElementById('result').value = 'Error';
  }
}

</script>
</body>
</html>`
  },
  '天气卡片': {
    explanation: '这是一个简单的天气卡片',
    html: `<!DOCTYPE html>
<html>
<head>
<style>
.weather-card {
  width: 300px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.city {
  font-size: 24px;
  margin-bottom: 10px;
}

.temperature {
  font-size: 48px;
  margin-bottom: 10px;
}

.description {
  font-size: 18px;
  margin-bottom: 20px;
  text-transform: capitalize;
}

.details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.detail-item {
  padding: 10px;
  background-color: rgba(255,255,255,0.2);
  border-radius: 4px;
}
</style>
</head>
<body>
<div class="weather-card">
  <div class="city">北京</div>
  <div class="temperature">25°C</div>
  <div class="description">晴天</div>
  <div class="details">
    <div class="detail-item">
      <div>湿度</div>
      <div>65%</div>
    </div>
    <div class="detail-item">
      <div>风速</div>
      <div>5 km/h</div>
    </div>
    <div class="detail-item">
      <div>气压</div>
      <div>1013 hPa</div>
    </div>
    <div class="detail-item">
      <div>能见度</div>
      <div>10 km</div>
    </div>
  </div>
</div>
</body>
</html>`
}
}

export interface GenerateUIRequest {
  message: string
  context?: string[]
  componentType?: string
}

export interface GenerateUIResponse {
  message: string
  uiCode: string
  componentType: string
  generatedAt: Date
}

export class UIGeneratorService {
  // 生成UI代码的核心方法
  async generateUI(request: GenerateUIRequest): Promise<GenerateUIResponse> {
    try {
      const { message, context = [], componentType = 'auto' } = request
      
      // 使用模拟数据进行演示
      let explanation = '这是一个示例界面'
      let htmlCode = `<div style="text-align: center; padding: 50px;"><h1>欢迎使用AUIFlow</h1><p>请输入需求，如："创建一个登录表单"、"计算器"或"天气卡片"</p></div>`
      
      // 匹配用户请求与模拟数据
      for (const [key, mockData] of Object.entries(MOCK_RESPONSES)) {
        if (message.includes(key)) {
          explanation = mockData.explanation
          htmlCode = mockData.html
          break
        }
      }
      
      // 安全过滤
      const sanitizedCode = sanitizeHtml(htmlCode)
      
      return {
        message: explanation || 'UI生成完成',
        uiCode: sanitizedCode,
        componentType: this.detectComponentType(sanitizedCode, componentType),
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Error generating UI:', error)
      throw new Error('Failed to generate UI: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }
  
  // 构建用户提示词
  private buildPrompt(message: string, context: string[], componentType: string): string {
    const contextStr = context.length > 0 
      ? `\n\n对话历史:\n${context.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`
      : ''
    
    return `根据用户需求生成一个美观、功能完整的HTML界面代码。用户需求是：${message}${contextStr}\n\n请严格按照以下格式输出：\n1. 先提供一段中文说明（50字以内）\n2. 然后提供完整的HTML/CSS/JS代码\n\n示例输出：\n这是一个简单的登录表单\n<!DOCTYPE html>\n<html>\n<head>\n<style>\n/* CSS样式 */\n</style>\n</head>\n<body>\n<!-- HTML内容 -->\n<script>\n// JavaScript代码\n</script>\n</body>\n</html>`
  }
  
  // 获取系统提示词
  private getSystemPrompt(): string {
    return `你是一个专业的UI设计师和前端开发工程师，擅长根据用户需求生成美观、功能完整的HTML/CSS/JS代码。\n\n要求：\n1. 生成的界面必须美观、响应式，适配不同屏幕尺寸\n2. CSS必须内联在HTML中，使用现代CSS特性\n3. JavaScript必须简洁高效，实现必要的交互功能\n4. 代码必须完整、可直接运行\n5. 避免使用外部依赖，所有资源必须内联\n6. 界面必须符合现代设计美学，色彩搭配合理\n7. 代码结构清晰，注释适当\n\n请按照用户要求的格式输出，先提供中文说明，然后是完整的HTML代码。`
  }
  
  // 解析AI响应
  private parseAIResponse(response: string): { uiCode: string; explanation: string } {
    // 分离说明和代码部分
    const parts = response.split(/<!DOCTYPE html>|<html>|<head>/)
    
    if (parts.length < 2) {
      // 如果没有标准的HTML结构，尝试寻找代码块
      const codeMatch = response.match(/```(html|\s*)([\s\S]*?)```/) // 匹配代码块
      if (codeMatch) {
        return {
          explanation: parts[0].trim() || 'UI生成完成',
          uiCode: codeMatch[2].trim()
        }
      }
      // 如果没有代码块，返回整个响应作为代码
      return {
        explanation: 'UI生成完成',
        uiCode: response
      }
    }
    
    const explanation = parts[0].trim()
    const codeStart = response.indexOf(parts[0]) + parts[0].length
    const uiCode = '<!DOCTYPE html>' + response.substring(codeStart).trim()
    
    return {
      explanation: explanation || 'UI生成完成',
      uiCode
    }
  }
  
  // 检测组件类型
  private detectComponentType(code: string, requestedType: string): string {
    if (requestedType !== 'auto') return requestedType
    
    if (code.includes('form') && (code.includes('input') || code.includes('button'))) {
      return 'form'
    }
    if (code.includes('table') || code.includes('tr') || code.includes('td')) {
      return 'table'
    }
    if (code.includes('chart') || code.includes('graph') || code.includes('canvas')) {
      return 'chart'
    }
    if (code.includes('card') && code.includes('div')) {
      return 'card'
    }
    if (code.includes('menu') || code.includes('nav') || code.includes('ul')) {
      return 'navigation'
    }
    
    return 'general'
  }
}