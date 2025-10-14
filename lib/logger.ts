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
  error?: Error | unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private get isProd() {
    return process.env.NODE_ENV === 'production'
  }

  /**
   * Sanitizar dados sensíveis antes de logar
   */
  private sanitize(context?: LogContext): LogContext {
    if (!context) return {}
    
    const sanitized = { ...context }
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'passwordHash', 'jwt', 'accessToken', 'refreshToken']
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log('🔍', message, context || '')
    }
  }

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext) {
    const sanitized = this.sanitize(context)
    if (!this.isProd) {
      console.info('ℹ️', message, sanitized)
    }
  }

  /**
   * Log de aviso - sempre exibido
   */
  warn(message: string, context?: LogContext) {
    const sanitized = this.sanitize(context)
    console.warn('⚠️', message, sanitized)
  }

  /**
   * Log de erro - sempre exibido
   */
  error(message: string, context?: LogContext) {
    const sanitized = this.sanitize(context)
    console.error('❌', message, sanitized)
    
    // Em produção, poderia enviar para serviço externo como Sentry
    if (this.isProd) {
      // TODO: Integrar com Sentry ou outro serviço
      // Sentry.captureException(context?.error || new Error(message), { extra: sanitized })
    }
  }

  /**
   * Performance logging - medir tempo de execução
   */
  performance(label: string, startTime: number) {
    const duration = Date.now() - startTime
    if (this.isDevelopment || duration > 1000) { // Log apenas se demorar mais de 1s em prod
      this.info(`⏱️  ${label}: ${duration}ms`, { duration })
    }
  }

  /**
   * Audit log - registrar ações importantes do usuário
   */
  audit(action: string, userId: string, context?: LogContext) {
    const auditLog = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...this.sanitize(context),
    }
    
    this.info(`[AUDIT] ${action}`, auditLog)
  }
}

export const logger = new Logger()
