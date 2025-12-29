export interface GenerateUIRequest {
  message: string;
  context?: string[];
  componentType?: string;
}

export interface GenerateUIResponse {
  success: boolean;
  message: string;
  uiCode: string;
  componentType: string;
  generatedAt: string;
}

export interface ComponentType {
  type: string;
  name: string;
}

export interface GetComponentsResponse {
  success: boolean;
  components: ComponentType[];
}

export class APIService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  // 生成UI代码
  async generateUI(request: GenerateUIRequest): Promise<GenerateUIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/generate-ui`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || `API请求失败: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('生成UI失败:', error);
      throw error;
    }
  }

  // 获取支持的组件类型
  async getComponents(): Promise<GetComponentsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/components`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || `API请求失败: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取组件类型失败:', error);
      throw error;
    }
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('健康检查失败:', error);
      return false;
    }
  }
}

// 创建API服务实例
export const apiService = new APIService();