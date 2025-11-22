// supabase/functions/update-chofer-pipefy/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Importa os cabeçalhos CORS partilhados
import { corsHeaders } from '../_shared/cors.ts';
const PIPEFY_API_URL = 'https://api.pipefy.com/graphql';
Deno.serve(async (req)=>{
  // Trata a requisição CORS preflight usando os cabeçalhos partilhados
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('Requisição recebida');
    // Validação do token do utilizador (JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Acesso não autorizado. Token não fornecido.");
    }
    console.log('Token autorizado');
    // Extrai a query GraphQL do corpo da requisição
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Corpo da requisição inválido (JSON malformado).");
    }
    const { query } = body;
    if (!query) {
      throw new Error("A 'query' não foi fornecida no corpo da requisição.");
    }
    console.log('Query recebida, tamanho:', query.length);
    // Pega o Token da API do Pipefy das variáveis de ambiente seguras
    const pipefyApiToken = Deno.env.get('PIPEFY_API_TOKEN');
    if (!pipefyApiToken) {
      console.error('PIPEFY_API_TOKEN não configurado');
      throw new Error('PIPEFY_API_TOKEN não configurado.');
    }
    console.log('Token Pipefy encontrado, enviando requisição...');
    // Envia a requisição para a API do Pipefy
    const response = await fetch(PIPEFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pipefyApiToken}`
      },
      body: JSON.stringify({
        query
      })
    });
    console.log('Resposta Pipefy status:', response.status);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Erro Pipefy:', errorBody);
      throw new Error(`Erro na API do Pipefy: ${response.status}`);
    }
    // Retorna a resposta do Pipefy para o frontend, incluindo os cabeçalhos CORS
    const data = await response.json();
    console.log('Resposta Pipefy recebida com sucesso');
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    // Em caso de erro, retorna uma resposta clara com os cabeçalhos CORS
    console.error('Erro na Edge Function:', error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
