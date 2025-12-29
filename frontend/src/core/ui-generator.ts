import { GenerateUIRequest, GenerateUIResponse, apiService } from './api';
import { sanitizeHTML } from '../utils/sanitizer';
import { ComponentRegistry } from './component-registry';

export interface UIRequestOptions {
  componentType?: string;
  context?: string[];
  onProgress?: (progress: number, status: string) => void;
}

export interface GeneratedUI {
  id: string;
  message: string;
  code: string;
  componentType: string;
  generatedAt: Date;
  sanitizedCode: string;
}

export class UIGenerator {
  private componentRegistry: ComponentRegistry;
  private generationHistory: GeneratedUI[] = [];

  constructor() {
    this.componentRegistry = new ComponentRegistry();
  }

  // 生成UI
  async generateUI(message: string, options: UIRequestOptions = {}): Promise<GeneratedUI> {
    const { componentType = 'auto', context = [], onProgress } = options;

    try {
      // 通知开始生成
      onProgress?.(0, '正在分析需求...');

      // 构建请求
      const request: GenerateUIRequest = {
        message,
        context,
        componentType,
      };

      // 通知正在调用API
      onProgress?.(30, '正在生成UI代码...');

      // 调用API生成UI
      const response = await apiService.generateUI(request);

      if (!response.success) {
        throw new Error(response.message || '生成UI失败');
      }

      // 通知正在处理结果
      onProgress?.(70, '正在处理生成的代码...');

      // 清理和验证生成的代码
      const sanitizedCode = sanitizeHTML(response.uiCode);

      // 创建GeneratedUI实例
      const generatedUI: GeneratedUI = {
        id: `ui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: response.message,
        code: response.uiCode,
        componentType: response.componentType,
        generatedAt: new Date(response.generatedAt),
        sanitizedCode,
      };

      // 保存到历史记录
      this.generationHistory.push(generatedUI);

      // 限制历史记录数量
      if (this.generationHistory.length > 20) {
        this.generationHistory.shift();
      }

      // 通知完成
      onProgress?.(100, 'UI生成完成');

      return generatedUI;
    } catch (error) {
      console.error('生成UI失败:', error);
      throw new Error(error instanceof Error ? error.message : '生成UI时发生未知错误');
    }
  }

  // 获取历史记录
  getHistory(): GeneratedUI[] {
    return [...this.generationHistory];
  }

  // 获取特定历史记录
  getHistoryItem(id: string): GeneratedUI | undefined {
    return this.generationHistory.find(item => item.id === id);
  }

  // 清除历史记录
  clearHistory(): void {
    this.generationHistory = [];
  }

  // 注册自定义组件
  registerComponent(type: string, component: any): void {
    this.componentRegistry.register(type, component);
  }

  // 获取组件信息
  getComponentInfo(type: string): any {
    return this.componentRegistry.get(type);
  }

  // 导出生成的UI
  exportUI(ui: GeneratedUI, format: 'html' | 'json' = 'html'): string {
    if (format === 'json') {
      return JSON.stringify(
        {
          ...ui,
          generatedAt: ui.generatedAt.toISOString(),
        },
        null,
        2
      );
    } else {
      return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AUIFlow 生成的UI</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        .metadata {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 0.9em;
            color: #666;
        }
        .generated-ui {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 4px;
            background-color: #fafafa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AUIFlow 生成的UI</h1>
        <div class="metadata">
            <p><strong>生成时间:</strong> ${ui.generatedAt.toLocaleString()}</p>
            <p><strong>组件类型:</strong> ${ui.componentType}</p>
            <p><strong>提示:</strong> ${ui.message}</p>
        </div>
        <div class="generated-ui">
            ${ui.sanitizedCode}
        </div>
    </div>
</body>
</html>`;
    }
  }
}

// 创建全局UI生成器实例
export const uiGenerator = new UIGenerator();