#!/bin/bash

# Script para atualizar as chamadas do Pipefy no MobileTaskManager.tsx

echo "🔄 Atualizando MobileTaskManager.tsx..."

# Fazer backup
cp components/MobileTaskManager.tsx components/MobileTaskManager.tsx.bak

# Criar arquivo temporário com as substituições
cat components/MobileTaskManager.tsx | \
sed -e '/const response = await fetch.*api\.pipefy\.com\/graphql/,/throw new Error(`Erro do Pipefy:.*`);/{
s/const response = await fetch.*$/const result = await pipefyClient.query(updateQuery);/
/method: .POST.,/d
/headers: {/d
/\.\.\..*process\.env\.NEXT_PUBLIC_PIPEFY_TOKEN/d
/.Content-Type.: .application\/json.,/d
/},/d
/body: JSON\.stringify.*$/d
/});/d
//d
/if (!response\.ok)/,/throw new Error.*requisição ao Pipefy/d
//d
/const result = await response\.json();/d
/if (result\.errors)/,/throw new Error.*Erro do Pipefy/c\
      \
      if (!result.data || !result.data.updateNodeV2) {\
        throw new Error('\''Falha ao atualizar card no Pipefy'\'');\
      }
}' | \
sed -e 's/fetch('\''https:\/\/api\.pipefy\.com\/graphql'\'', {$/pipefyClient.query(updateQuery),/' | \
sed -e '/pipefyClient\.query(updateQuery),/,/body: JSON\.stringify({ query: updateQuery }),/{
/method: .POST.,/d
/headers: {/d
/\.\.\..*process\.env\.NEXT_PUBLIC_PIPEFY_TOKEN/d
/.Content-Type.: .application\/json.,/d
/},$/d
/body: JSON\.stringify.*$/d
}' | \
sed -e 's/fetch('\''https:\/\/api\.pipefy\.com\/graphql'\'', {$/pipefyClient.query(commentQuery)/' | \
sed -e '/pipefyClient\.query(commentQuery)$/,/body: JSON\.stringify({ query: commentQuery }),/{
/method: .POST.,/d
/headers: {/d
/\.\.\..*process\.env\.NEXT_PUBLIC_PIPEFY_TOKEN/d
/.Content-Type.: .application\/json.,/d
/},$/d
/body: JSON\.stringify.*$/d
}' > components/MobileTaskManager.tsx.new

# Verificar se o arquivo foi criado
if [ -f components/MobileTaskManager.tsx.new ]; then
    mv components/MobileTaskManager.tsx.new components/MobileTaskManager.tsx
    echo "✅ Arquivo atualizado com sucesso!"
else
    echo "❌ Erro ao criar arquivo atualizado"
    exit 1
fi