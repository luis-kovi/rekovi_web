/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para desabilitar pré-renderizado
  experimental: {
    // Desabilitar pré-renderizado estático
    staticPageGenerationTimeout: 0
  },
  // Forçar renderização dinâmica
  output: 'standalone',
  // Desabilitar geração estática
  trailingSlash: false,
  // Configurar para sempre renderizar dinamicamente
  generateStaticParams: async () => {
    return []
  }
}

export default nextConfig
