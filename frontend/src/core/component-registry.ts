import React from 'react';

export interface ComponentInfo {
  name: string;
  description: string;
  component: React.ComponentType<any>;
  props: Record<string, any>;
  examples: string[];
}

export interface RegisteredComponent {
  type: string;
  info: ComponentInfo;
}

export class ComponentRegistry {
  private components: Map<string, ComponentInfo> = new Map();

  constructor() {
    this.initializeDefaultComponents();
  }

  // 初始化默认组件
  private initializeDefaultComponents(): void {
    // 这里可以注册默认的React组件
    // 例如：
    // this.register('button', {
    //   name: '按钮',
    //   description: '基础按钮组件',
    //   component: Button,
    //   props: { variant: 'primary', size: 'medium' },
    //   examples: ['创建一个红色按钮', '添加一个提交按钮']
    // });
  }

  // 注册组件
  register(type: string, info: ComponentInfo): void {
    if (!type || !info) {
      throw new Error('组件类型和信息不能为空');
    }

    if (!info.component) {
      throw new Error('组件必须提供React组件');
    }

    this.components.set(type, info);
  }

  // 注册多个组件
  registerMultiple(components: Array<{ type: string; info: ComponentInfo }>): void {
    components.forEach(({ type, info }) => this.register(type, info));
  }

  // 获取组件
  get(type: string): ComponentInfo | undefined {
    return this.components.get(type);
  }

  // 获取所有组件
  getAll(): RegisteredComponent[] {
    const result: RegisteredComponent[] = [];
    this.components.forEach((info, type) => {
      result.push({ type, info });
    });
    return result;
  }

  // 获取组件类型列表
  getComponentTypes(): string[] {
    return Array.from(this.components.keys());
  }

  // 检查组件是否已注册
  has(type: string): boolean {
    return this.components.has(type);
  }

  // 移除组件
  unregister(type: string): boolean {
    return this.components.delete(type);
  }

  // 清空所有组件
  clear(): void {
    this.components.clear();
    this.initializeDefaultComponents();
  }

  // 根据组件类型获取示例提示
  getExamples(type: string): string[] {
    const component = this.get(type);
    return component?.examples || [];
  }

  // 根据需求描述匹配最合适的组件
  matchComponent(description: string): RegisteredComponent | undefined {
    const components = this.getAll();
    const lowerDescription = description.toLowerCase();

    // 简单的匹配逻辑：检查组件名称和描述是否包含关键词
    for (const component of components) {
      const lowerName = component.info.name.toLowerCase();
      const lowerDesc = component.info.description.toLowerCase();

      if (lowerDescription.includes(lowerName) || lowerDescription.includes(lowerDesc)) {
        return component;
      }
    }

    // 检查示例是否匹配
    for (const component of components) {
      for (const example of component.info.examples) {
        const lowerExample = example.toLowerCase();
        if (lowerDescription.includes(lowerExample)) {
          return component;
        }
      }
    }

    return undefined;
  }

  // 获取组件统计信息
  getStats(): {
    totalComponents: number;
    componentTypes: string[];
    examplesCount: number;
  } {
    const components = this.getAll();
    const totalExamples = components.reduce((count, component) => {
      return count + component.info.examples.length;
    }, 0);

    return {
      totalComponents: components.length,
      componentTypes: this.getComponentTypes(),
      examplesCount: totalExamples,
    };
  }
}