import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Configuração para melhor performance
  experimental: {
    // Otimizar imports de pacotes específicos
    optimizePackageImports: ['@supabase/ssr']
  },
  // Configuração de trailing slash
  trailingSlash: false,
  // Habilitar verificação de tipos durante o build (recomendado)
  typescript: {
    ignoreBuildErrors: false
  },
  // Habilitar ESLint durante o build (recomendado)
  eslint: {
    ignoreDuringBuilds: false
  },
  // Configurações de segurança
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.pipefy.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
          }
        ]
      }
    ]
  },
  // Webpack configuration para resolver o problema do Edge Runtime
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configuração para o cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    return config
  }
}

export default nextConfig