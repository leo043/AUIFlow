import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// 初始化JSDOM环境，用于在Node.js中使用DOMPurify
const { window } = new JSDOM('<!DOCTYPE html>')
const purify = DOMPurify(window)

// 自定义安全策略配置
const securityConfig = {
  // 允许的HTML标签
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'div', 'span', 'br', 'hr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'form', 'input', 'textarea', 'button', 'select', 'option',
    'label', 'fieldset', 'legend',
    'a', 'img', 'video', 'audio',
    'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre',
    'blockquote', 'q', 'cite',
    'canvas', 'svg', 'g', 'path', 'circle', 'rect', 'line',
    'header', 'footer', 'nav', 'section', 'article', 'aside',
    'main', 'figure', 'figcaption', 'dialog'
  ],
  
  // 允许的HTML属性
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'width', 'height',
    'class', 'id', 'style', 'data-*',
    'type', 'value', 'placeholder', 'required', 'disabled', 'readonly',
    'name', 'for', 'selected', 'checked', 'max', 'min', 'step',
    'rows', 'cols', 'autocomplete',
    'role', 'aria-*',
    'onclick', 'onchange', 'oninput', 'onsubmit', 'onreset', 'onkeydown',
    'target', 'rel'
  ],
  
  // 允许的CSS属性
  ALLOWED_CSS: [
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'margin', 'padding', 'width', 'height', 'max-width', 'max-height',
    'color', 'background', 'background-color', 'border', 'border-radius',
    'font', 'font-size', 'font-family', 'font-weight', 'font-style',
    'text-align', 'text-decoration', 'text-transform', 'line-height',
    'opacity', 'visibility', 'z-index',
    'flex', 'flex-direction', 'justify-content', 'align-items',
    'grid', 'grid-template-columns', 'grid-template-rows',
    'box-shadow', 'transition', 'transform'
  ]
}

export interface SanitizeOptions {
  allowInlineScripts?: boolean
  allowInlineStyles?: boolean
  allowIframes?: boolean
  customTags?: string[]
  customAttrs?: string[]
}

/**
 * 过滤HTML内容，防止XSS攻击
 * @param html 需要过滤的HTML内容
 * @param options 过滤选项
 * @returns 安全的HTML内容
 */
export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  try {
    const { 
      allowInlineScripts = true, 
      allowInlineStyles = true,
      allowIframes = false,
      customTags = [],
      customAttrs = []
    } = options

    // 1. 初步过滤：删除危险的脚本标签和属性
    let filteredHtml = html
      // 删除script标签
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      // 删除object, embed, iframe等危险标签
      .replace(/<(object|embed|iframe)[^>]*>.*?<\/(object|embed|iframe)>/gi, '')
      // 删除事件处理属性，除非明确允许
      .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      // 删除javascript:伪协议
      .replace(/javascript:\s*[^\s"'>]+/gi, '')
      // 删除vbscript:伪协议
      .replace(/vbscript:\s*[^\s"'>]+/gi, '')
      // 删除data:伪协议中的脚本
      .replace(/data:text\/(javascript|html)[^\s"'>]+/gi, '')

    // 2. 使用DOMPurify进行深度过滤
    const sanitizedHtml = purify.sanitize(filteredHtml, {
      ALLOWED_TAGS: [...securityConfig.ALLOWED_TAGS, ...customTags],
      ALLOWED_ATTR: [...securityConfig.ALLOWED_ATTR, ...customAttrs],
      ALLOWED_CSS: securityConfig.ALLOWED_CSS,
      FORBID_TAGS: ['script', 'object', 'embed', ...(allowIframes ? [] : ['iframe'])],
      FORBID_ATTR: ['onerror', 'onload', 'onmouseover', ...(!allowInlineScripts ? securityConfig.ALLOWED_ATTR.filter(attr => attr.startsWith('on')) : [])],
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target'],
      // 自定义属性检查
      attributeNameChecker: (node, attr) => {
        // 允许所有data-*属性
        if (attr.startsWith('data-')) return true
        // 允许所有aria-*属性
        if (attr.startsWith('aria-')) return true
        return securityConfig.ALLOWED_ATTR.includes(attr) || customAttrs.includes(attr)
      },
      // 自定义标签检查
      tagNameChecker: (tag) => {
        return securityConfig.ALLOWED_TAGS.includes(tag.toLowerCase()) || customTags.includes(tag.toLowerCase())
      }
    })

    // 3. 最终检查：确保没有遗漏的危险内容
    return finalSecurityCheck(sanitizedHtml, options)

  } catch (error) {
    console.error('Error sanitizing HTML:', error)
    return '<p>安全过滤失败，请重试</p>'
  }
}

/**
 * 最终安全检查
 * @param html 经过初步过滤的HTML内容
 * @param options 过滤选项
 * @returns 最终安全的HTML内容
 */
function finalSecurityCheck(html: string, options: SanitizeOptions): string {
  let finalHtml = html

  // 检查并处理危险的CSS属性
  if (options.allowInlineStyles) {
    finalHtml = finalHtml.replace(/style\s*=\s*("[^"]*"|'[^']*')/gi, (match, styleContent) => {
      const style = styleContent.slice(1, -1) // 去除引号
      const sanitizedStyle = sanitizeCss(style)
      return `style="${sanitizedStyle}"`
    })
  } else {
    // 移除所有内联样式
    finalHtml = finalHtml.replace(/style\s*=\s*("[^"]*"|'[^']*')/gi, '')
  }

  // 检查并处理危险的链接
  finalHtml = finalHtml.replace(/href\s*=\s*("[^"]*"|'[^']*')/gi, (match, hrefContent) => {
    const href = hrefContent.slice(1, -1) // 去除引号
    if (isSafeUrl(href)) {
      return match
    }
    return `href="#"`
  })

  // 检查并处理危险的图片源
  finalHtml = finalHtml.replace(/src\s*=\s*("[^"]*"|'[^']*')/gi, (match, srcContent) => {
    const src = srcContent.slice(1, -1) // 去除引号
    if (isSafeUrl(src) || src.startsWith('data:image/')) {
      return match
    }
    return `src=""`
  })

  return finalHtml
}

/**
 * 过滤CSS内容
 * @param css 需要过滤的CSS内容
 * @returns 安全的CSS内容
 */
function sanitizeCss(css: string): string {
  // 只允许安全的CSS属性
  return css.split(';')
    .map(declaration => {
      const [property, value] = declaration.split(':').map(part => part.trim())
      if (!property || !value) return ''
      
      // 检查属性是否在允许列表中
      if (securityConfig.ALLOWED_CSS.includes(property)) {
        // 检查值是否包含危险内容
        if (!value.includes('javascript:') && 
            !value.includes('expression(') && 
            !value.includes('url(javascript:')) {
          return `${property}: ${value}`
        }
      }
      return ''
    })
    .filter(Boolean)
    .join('; ')
}

/**
 * 检查URL是否安全
 * @param url 需要检查的URL
 * @returns URL是否安全
 */
function isSafeUrl(url: string): boolean {
  if (!url) return false
  
  // 允许的协议
  const allowedProtocols = ['http:', 'https:', 'ftp:', 'mailto:', 'tel:', 'sms:']
  
  try {
    const parsedUrl = new URL(url)
    return allowedProtocols.includes(parsedUrl.protocol)
  } catch {
    // 如果不是标准URL格式，检查是否为相对路径
    return !url.startsWith('javascript:') && 
           !url.startsWith('vbscript:') && 
           !url.startsWith('data:text/javascript') &&
           !url.startsWith('data:text/html')
  }
}

/**
 * 验证生成的代码是否安全
 * @param code 需要验证的代码
 * @returns 验证结果和错误信息
 */
export function validateGeneratedCode(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 检查是否包含危险的脚本标签
  if (/<script[^>]*>.*?<\/script>/gi.test(code)) {
    errors.push('检测到危险的script标签')
  }
  
  // 检查是否包含危险的事件处理属性
  if (/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi.test(code)) {
    errors.push('检测到危险的事件处理属性')
  }
  
  // 检查是否包含javascript伪协议
  if (/javascript:\s*[^\s"'>]+/gi.test(code)) {
    errors.push('检测到危险的javascript伪协议')
  }
  
  // 检查是否包含危险的CSS属性
  if (/expression\(|behavior:\s*url\(|moz-binding:\s*url\(/gi.test(code)) {
    errors.push('检测到危险的CSS属性')
  }
  
  // 检查是否包含危险的HTML标签
  if (/<(object|embed|iframe)[^>]*>.*?<\/(object|embed|iframe)>/gi.test(code)) {
    errors.push('检测到危险的HTML标签（object/embed/iframe）')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}