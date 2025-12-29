import { createLogger, format, transports } from 'winston'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '../../config/.env' })

// 日志级别配置
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

// 定义日志格式
const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.printf((info) => {
    const { timestamp, level, message, ...meta } = info
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaString}`
  })
)

// 创建日志记录器
export const logger = createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports: [
    // 控制台输出
    new transports.Console({
      format: format.combine(
        format.colorize(),
        logFormat
      )
    }),
    // 文件输出 - 所有日志
    new transports.File({
      filename: '../../logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // 文件输出 - 错误日志
    new transports.File({
      filename: '../../logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  // 异常处理
  exceptionHandlers: [
    new transports.File({
      filename: '../../logs/exceptions.log',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    })
  ],
  rejectionHandlers: [
    new transports.File({
      filename: '../../logs/rejections.log',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    })
  ]
})

// 开发环境下的日志增强
if (process.env.NODE_ENV === 'development') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }))
}

// 导出日志记录函数
export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta)
}

export const logError = (message: string, meta?: Record<string, any>) => {
  logger.error(message, meta)
}

export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta)
}

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta)
}

export const logVerbose = (message: string, meta?: Record<string, any>) => {
  logger.verbose(message, meta)
}