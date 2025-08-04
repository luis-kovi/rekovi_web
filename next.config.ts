/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração simplificada para produção
  experimental: {
    // Desabilitar pré-renderizado estático
    staticPageGenerationTimeout: 0
  },
  // Forçar renderização dinâmica
  output: 'standalone'
}

export default nextConfig
