/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adicione essa configuração para aspeitar o prefixo de URL do GitHub Codespaces
  assetPrefix: process.env.NODE_ENV === 'development' && process.env.GITHUB_CODESPACES ? 
    `https://${process.env.CODESPACE_NAME}-3000.app.github.dev` : '',
  
  // Se você estiver usando variáveis de ambiente para URLs
  publicRuntimeConfig: {
    basePath: process.env.NODE_ENV === 'development' && process.env.GITHUB_CODESPACES ? 
      `https://${process.env.CODESPACE_NAME}-3000.app.github.dev` : '',
  }
}

module.exports = nextConfig