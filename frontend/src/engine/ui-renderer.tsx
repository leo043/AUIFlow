import React, { useEffect, useRef, useState } from 'react';
import { sanitizeHTML, validateHTML } from '../utils/sanitizer';

export interface UIRendererProps {
  html: string;
  onRender?: (success: boolean, errors?: string[]) => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  sandbox?: boolean;
}

export interface RenderStatus {
  isRendering: boolean;
  isRendered: boolean;
  hasErrors: boolean;
  errorMessages: string[];
}

export const UIRenderer: React.FC<UIRendererProps> = ({
  html,
  onRender,
  onError,
  className = '',
  style,
  sandbox = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<RenderStatus>({
    isRendering: false,
    isRendered: false,
    hasErrors: false,
    errorMessages: [],
  });

  // 渲染HTML内容
  useEffect(() => {
    if (!html) {
      clearRender();
      return;
    }

    setStatus((prev) => ({ ...prev, isRendering: true, hasErrors: false, errorMessages: [] }));

    try {
      // 验证和清理HTML
      const validation = validateHTML(html);
      if (!validation.isValid) {
        throw new Error('生成的HTML代码包含安全风险');
      }

      const sanitizedHtml = sanitizeHTML(html);

      if (sandbox && iframeRef.current) {
        // 使用iframe渲染
        renderInIframe(sanitizedHtml);
      } else if (containerRef.current) {
        // 直接渲染在div中
        renderDirectly(sanitizedHtml);
      }

      setStatus((prev) => ({ ...prev, isRendering: false, isRendered: true }));
      onRender?.(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '渲染失败';
      setStatus((prev) => ({
        ...prev,
        isRendering: false,
        isRendered: false,
        hasErrors: true,
        errorMessages: [errorMessage],
      }));
      onRender?.(false, [errorMessage]);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [html, sandbox, onRender, onError]);

  // 清理渲染
  const clearRender = () => {
    setStatus((prev) => ({ ...prev, isRendered: false, hasErrors: false, errorMessages: [] }));
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    if (iframeRef.current?.contentDocument) {
      iframeRef.current.contentDocument.body.innerHTML = '';
    }
  };

  // 直接渲染HTML
  const renderDirectly = (html: string) => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = html;

    // 重新执行脚本
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      // 复制属性
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // 复制内容
      newScript.textContent = oldScript.textContent;
      // 替换旧脚本
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  };

  // 使用iframe渲染HTML
  const renderInIframe = (html: string) => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;

    if (!doc) return;

    // 设置iframe内容
    doc.open();
    doc.write(html);
    doc.close();

    // 注入样式重置
    const style = doc.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        padding: 1rem;
        background-color: white;
      }
    `;
    doc.head.appendChild(style);

    // 设置iframe大小自适应
    const resizeIframe = () => {
      if (iframe.contentDocument) {
        const body = iframe.contentDocument.body;
        const html = iframe.contentDocument.documentElement;
        const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        iframe.style.height = `${height + 20}px`;
      }
    };

    // 监听iframe内容变化
    iframe.addEventListener('load', resizeIframe);
    doc.addEventListener('DOMContentLoaded', resizeIframe);

    // 清理事件监听
    return () => {
      iframe.removeEventListener('load', resizeIframe);
      doc.removeEventListener('DOMContentLoaded', resizeIframe);
    };
  };

  return (
    <div className={`ui-renderer ${className}`} style={style}>
      {status.isRendering && (
        <div className="rendering-indicator">
          <div className="spinner"></div>
          <p>正在渲染...</p>
        </div>
      )}
      {status.hasErrors && (
        <div className="render-error">
          <h3>渲染错误</h3>
          <ul>
            {status.errorMessages.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {!status.isRendering && !status.hasErrors && (
        <>
          {sandbox ? (
            <iframe
              ref={iframeRef}
              className="render-iframe"
              sandbox="allow-scripts allow-same-origin allow-forms"
              title="UI Preview"
            />
          ) : (
            <div ref={containerRef} className="render-container" />
          )}
        </>
      )}
      <style jsx>{`
        .ui-renderer {
          position: relative;
          width: 100%;
          min-height: 300px;
          background-color: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .render-iframe {
          width: 100%;
          height: 100%;
          min-height: 300px;
          border: none;
          background-color: white;
        }
        
        .render-container {
          width: 100%;
          min-height: 300px;
          padding: 1rem;
          background-color: white;
        }
        
        .rendering-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #666;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #2196f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .render-error {
          padding: 1.5rem;
          background-color: #ffebee;
          color: #c62828;
        }
        
        .render-error h3 {
          margin-top: 0;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }
        
        .render-error ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .render-error li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default UIRenderer;