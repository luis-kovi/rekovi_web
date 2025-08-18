# Guia de Migração de Imagens para Next.js Image Component

## 📋 Lista de Imagens Hospedadas Externamente

### 1. Logo da Empresa
- **URL Atual**: `https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png`
- **Usado em**: 
  - `components/MobileHeader.tsx`
  - `components/Header.tsx`
  - `app/auth/signin/page.tsx`
- **Nome sugerido**: `kovi-logo.png`
- **Destino**: `/public/images/logos/kovi-logo.png`

### 2. Logo da Empresa (Variação)
- **URL Atual**: `https://i.ibb.co/1fTXGSN6/rekovi-identity-updated-1-removebg-preview.png`
- **Usado em**: `app/auth/signup/page.tsx`
- **Nome sugerido**: `kovi-logo-signup.png`
- **Destino**: `/public/images/logos/kovi-logo-signup.png`

### 3. Ícone da Aplicação
- **URL Atual**: `https://i.ibb.co/ksMQSMQ2/web-app-manifest-192x192.png`
- **Usado em**: `app/layout.tsx` (como favicon)
- **Nome sugerido**: `favicon-192x192.png`
- **Destino**: `/public/images/icons/favicon-192x192.png`

### 4. Logo do Google
- **URL Atual**: `https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg`
- **Usado em**: `app/auth/signin/page.tsx`
- **Nome sugerido**: `google-logo.svg`
- **Destino**: `/public/images/icons/google-logo.svg`

### 5. Imagens de Placeholder para Fotos de Veículos
- **Frente**: `https://i.ibb.co/tMqXPvs9/frente.png`
- **Traseira**: `https://i.ibb.co/YTWw79s1/traseira.jpg`
- **Lateral Direita**: `https://i.ibb.co/mrDwHRn6/lateral-d.jpg`
- **Lateral Esquerda**: `https://i.ibb.co/jZPXMq92/lateral-e.jpg`
- **Estepe**: `https://i.ibb.co/Y4jmyW7v/estepe.jpg`
- **Painel**: `https://i.ibb.co/PGX4bNd8/painel.jpg`
- **Veículo no Guincho**: `https://i.ibb.co/KxBvwbyz/Gemini-Generated-Image-8d4po88d4po88d4p.jpg`

**Usado em**: 
- `components/CardModal.tsx`
- `components/MobileTaskModal.tsx`

**Destino**: `/public/images/placeholders/`

## 🚀 Passo a Passo da Migração

### Passo 1: Baixar as Imagens

Execute os seguintes comandos para baixar todas as imagens:

```bash
# Criar diretórios se ainda não existirem
mkdir -p public/images/logos public/images/icons public/images/placeholders

# Baixar logos
wget -O public/images/logos/kovi-logo.png "https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png"
wget -O public/images/logos/kovi-logo-signup.png "https://i.ibb.co/1fTXGSN6/rekovi-identity-updated-1-removebg-preview.png"

# Baixar ícones
wget -O public/images/icons/favicon-192x192.png "https://i.ibb.co/ksMQSMQ2/web-app-manifest-192x192.png"
wget -O public/images/icons/google-logo.svg "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"

# Baixar placeholders de veículos
wget -O public/images/placeholders/vehicle-front.png "https://i.ibb.co/tMqXPvs9/frente.png"
wget -O public/images/placeholders/vehicle-rear.jpg "https://i.ibb.co/YTWw79s1/traseira.jpg"
wget -O public/images/placeholders/vehicle-right.jpg "https://i.ibb.co/mrDwHRn6/lateral-d.jpg"
wget -O public/images/placeholders/vehicle-left.jpg "https://i.ibb.co/jZPXMq92/lateral-e.jpg"
wget -O public/images/placeholders/vehicle-spare.jpg "https://i.ibb.co/Y4jmyW7v/estepe.jpg"
wget -O public/images/placeholders/vehicle-dashboard.jpg "https://i.ibb.co/PGX4bNd8/painel.jpg"
wget -O public/images/placeholders/vehicle-on-tow.jpg "https://i.ibb.co/KxBvwbyz/Gemini-Generated-Image-8d4po88d4po88d4p.jpg"
```

### Passo 2: Otimizar as Imagens

Recomenda-se otimizar as imagens antes de usar em produção:

```bash
# Instalar ferramenta de otimização (se não tiver)
npm install -g sharp-cli

# Otimizar imagens PNG
sharp -i public/images/logos/kovi-logo.png -o public/images/logos/kovi-logo.webp
sharp -i public/images/placeholders/vehicle-front.png -o public/images/placeholders/vehicle-front.webp

# Para JPG, converter para WebP também
sharp -i public/images/placeholders/vehicle-rear.jpg -o public/images/placeholders/vehicle-rear.webp
```

### Passo 3: Substituir Tags `<img>` por `next/image`

#### Exemplo de Conversão:

**Antes:**
```jsx
<img 
  src="https://i.ibb.co/d4kbJGGY/rekovi-identity-updated-1-removebg-preview.png" 
  alt="Logo Kovi" 
  className="h-8 w-auto lg:h-10"
/>
```

**Depois:**
```jsx
import Image from 'next/image'

<Image 
  src="/images/logos/kovi-logo.png" 
  alt="Logo Kovi" 
  width={120}
  height={40}
  className="h-8 w-auto lg:h-10"
  priority // Adicione isso para imagens above-the-fold
/>
```

### Passo 4: Atualizar Configuração do Next.js

Se você mantiver algumas imagens externas, adicione os domínios ao `next.config.js`:

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['i.ibb.co', 'www.gstatic.com'],
    // ou use remotePatterns para mais segurança:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gstatic.com',
        pathname: '/firebasejs/ui/**',
      },
    ],
  },
}
```

### Passo 5: Criar Componente Auxiliar para Placeholders

Crie um componente para centralizar os placeholders:

```tsx
// components/VehiclePlaceholders.ts
export const vehiclePlaceholders = {
  frente: '/images/placeholders/vehicle-front.png',
  traseira: '/images/placeholders/vehicle-rear.jpg',
  lateralDireita: '/images/placeholders/vehicle-right.jpg',
  lateralEsquerda: '/images/placeholders/vehicle-left.jpg',
  estepe: '/images/placeholders/vehicle-spare.jpg',
  painel: '/images/placeholders/vehicle-dashboard.jpg',
  guincho: '/images/placeholders/vehicle-on-tow.jpg',
} as const
```

## 📌 Checklist de Migração

- [ ] Baixar todas as imagens listadas
- [ ] Otimizar imagens (converter para WebP quando possível)
- [ ] Substituir todas as tags `<img>` por `<Image>` do Next.js
- [ ] Adicionar width e height apropriados
- [ ] Adicionar `priority` para imagens above-the-fold
- [ ] Testar carregamento em diferentes dispositivos
- [ ] Verificar se todas as imagens estão carregando corretamente
- [ ] Remover domínios externos do next.config.js após migração completa

## 🎯 Benefícios da Migração

1. **Performance**: Carregamento otimizado com lazy loading automático
2. **Otimização**: Redimensionamento automático baseado no dispositivo
3. **SEO**: Melhor pontuação no Core Web Vitals
4. **Controle**: Imagens hospedadas localmente, sem dependência externa
5. **Cache**: Melhor controle de cache e CDN

## ⚠️ Pontos de Atenção

1. Sempre especifique `width` e `height` ou use `fill` com um container com dimensões
2. Use `priority={true}` apenas para imagens críticas (LCP)
3. Para imagens responsivas, use `sizes` prop
4. Considere usar `placeholder="blur"` com `blurDataURL` para melhor UX