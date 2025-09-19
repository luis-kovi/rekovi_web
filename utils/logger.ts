// utils/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Lista de padrões sensíveis para sanitização
 */
const SENSITIVE_PATTERNS = [
  // Tokens e chaves
  /(?:token|key|secret|password|pwd|pass|api[-_]?key|apikey|auth|authorization|bearer)\s*[:=]\s*["']?([^"'\s,}]+)["']?/gi,
  // Emails em contexto de autenticação
  /(?:email|user|username)\s*[:=]\s*["']?([^@\s]+@[^"'\s,}]+)["']?/gi,
  // URLs com credenciais
  /(?:https?:\/\/)([^:]+:[^@]+)@/gi,
  // Headers de autorização
  /(?:Authorization|X-API-Key|X-Auth-Token)\s*[:=]\s*["']?([^"'\s,}]+)["']?/gi,
  // Session IDs e cookies
  /(?:session[-_]?id|sessid|sid|session)\s*[:=]\s*["']?([a-zA-Z0-9]{16,})["']?/gi,
  // Supabase specific
  /sb[-_]?(?:auth[-_]?token|access[-_]?token|refresh[-_]?token)\s*[:=]\s*["']?([^"'\s,}]+)["']?/gi,
];

/**
 * Sanitiza dados sensíveis de uma string
 */
function sanitize(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match, capture) => {
        const key = match.substring(0, match.indexOf(capture));
        return `${key}[REDACTED]`;
      });
    });
    return sanitized;
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitize(item));
    }
    
    const sanitized: any = {};
    for (const key in data) {
      // Sanitizar chaves conhecidas
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('session') ||
        lowerKey.includes('cookie')
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Logger utility that only logs in development environment
 * Prevents console logs in production for security and performance
 * Sanitizes sensitive data before logging
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(arg => sanitize(arg));
      // eslint-disable-next-line no-console
      console.log(...sanitizedArgs);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(arg => sanitize(arg));
      console.error(...sanitizedArgs);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(arg => sanitize(arg));
      console.warn(...sanitizedArgs);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(arg => sanitize(arg));
      // eslint-disable-next-line no-console
      console.debug(...sanitizedArgs);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(arg => sanitize(arg));
      // eslint-disable-next-line no-console
      console.info(...sanitizedArgs);
    }
  }
};

export default logger;