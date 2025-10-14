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

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
  error?: Error | unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logDir = join(process.cwd(), 'logs')

  constructor() {
    // Criar diretório de logs se não existir (apenas em produção)
    if (this.isProd && !existsSync(this.logDir)) {
      try {
        mkdirSync(this.logDir, { recursive: true })
      } catch (error) {
        console.error('Failed to create logs directory:', error)
      }
    }
  }

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
   * Escrever log em arquivo (apenas em produção)
   */
  private writeToFile(level: string, message: string, context?: LogContext) {
    if (!this.isProd) return
    
    try {
      const timestamp = new Date().toISOString()
      
      const logData: Record<string, unknown> = {
        timestamp,
        level,
        message,
        context: this.sanitize(context),
      }
      
      // Adicionar stack trace se for um Error
      if (context?.error && context.error instanceof Error) {
        logData.stack = context.error.stack
        logData.errorMessage = context.error.message
      }
      
      const logEntry = JSON.stringify(logData) + '\n'
      
      const filename = `${new Date().toISOString().split('T')[0]}.log`
      const filepath = join(this.logDir, filename)
      
      appendFileSync(filepath, logEntry)
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
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
   * Log informativo - em produção, apenas erros e warnings no console
   */
  info(message: string, context?: LogContext) {
    const sanitized = this.sanitize(context)
    if (!this.isProd) {
      console.info('ℹ️', message, sanitized)
    }
    this.writeToFile('INFO', message, context)
  }

  /**
   * Log de aviso - sempre exibido
   */
  warn(message: string, context?: LogContext) {
    const sanitized = this.sanitize(context)
    console.warn('⚠️', message, sanitized)
    this.writeToFile('WARN', message, context)
  }

  /**
   * Log de erro - sempre exibido
   */
  error(message: string, context?: LogContext) {
    const sanitized = this.sanitize(context)
    console.error('❌', message, sanitized)
    this.writeToFile('ERROR', message, context)
    
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
    
    // Em produção, gravar em arquivo separado de auditoria
    if (this.isProd) {
      try {
        const filename = `audit-${new Date().toISOString().split('T')[0]}.log`
        const filepath = join(this.logDir, filename)
        appendFileSync(filepath, JSON.stringify(auditLog) + '\n')
      } catch (error) {
        console.error('Failed to write audit log:', error)
      }
    }
  }
}

export const logger = new Logger()
