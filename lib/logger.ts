/**
 * Sistema de logging centralizado
 * 
 * Uso:
 * ```typescript
 * import { logger } from '@/lib/logger'
 * 
 * logger.debug('Debug info', { userId: 123 })
 * logger.info('Operation completed')
 * logger.warn('Warning message', { details: '...' })
 * logger.error('Error occurred', { error })
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log('🔍', message, context || '')
    }
  }

  /**
   * Log informativo - sempre exibido
   */
  info(message: string, context?: LogContext) {
    console.info('ℹ️', message, context || '')
  }

  /**
   * Log de aviso - sempre exibido
   */
  warn(message: string, context?: LogContext) {
    console.warn('⚠️', message, context || '')
  }

  /**
   * Log de erro - sempre exibido
   */
  error(message: string, context?: LogContext) {
    console.error('❌', message, context || '')
  }

  /**
   * Log estruturado para análise
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }

    // Em produção, aqui você poderia enviar para um serviço de logging
    // como Sentry, LogRocket, Datadog, etc.
    if (!this.isDevelopment && level === 'error') {
      // TODO: Integrar com serviço de logging externo
      console.error(JSON.stringify(logEntry))
    }
  }
}

export const logger = new Logger()
