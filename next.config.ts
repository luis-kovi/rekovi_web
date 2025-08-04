/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração simplificada para produção
  output: 'standalone',
  experimental: {
    // Desabilitar pré-renderizado estático
    staticPageGenerationTimeout: 0
  }
}

export default nextConfig
