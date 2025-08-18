/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para melhor performance
  experimental: {
    // Manter configurações experimentais seguras
    optimizePackageImports: ['@supabase/ssr'],
    // Habilitar suporte ao Node.js runtime no middleware
    serverComponentsExternalPackages: ['@supabase/ssr']
  },
  // Configuração de saída - remover standalone para Vercel
  // output: 'standalone', // Comentado para compatibilidade com Vercel
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
  }
}

export default nextConfig