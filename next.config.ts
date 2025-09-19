import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Performance otimizada
  experimental: {
    // Otimizar imports de pacotes específicos
    optimizePackageImports: [
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react'
    ],
    // Otimizar CSS
    optimizeCss: true,
  },
  
  // Pacotes externos para servidor
  serverExternalPackages: ['@supabase/ssr'],
  
  // Otimizações de build
  compress: true,
  
  // Code splitting e chunks
  webpack: (config, { isServer, dev }) => {
    // Otimizações de produção
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk para bibliotecas grandes
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Chunk separado para React Query
            query: {
              name: 'query',
              chunks: 'all',
              test: /node_modules\/@tanstack/,
              priority: 30,
            },
            // Chunk separado para Framer Motion
            framer: {
              name: 'framer',
              chunks: 'all',
              test: /node_modules\/framer-motion/,
              priority: 30,
            },
            // Common chunk para código compartilhado
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    // Resolver problemas de fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Configuração de imagens otimizada
  images: {
    domains: [
      'localhost',
      '*.supabase.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configuração de trailing slash
  trailingSlash: false,
  
  // Verificações rigorosas
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'src', 'lib', 'utils']
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.pipefy.com https://*.s3.amazonaws.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
          }
        ]
      }
    ]
  }
}

export default nextConfig