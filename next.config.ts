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