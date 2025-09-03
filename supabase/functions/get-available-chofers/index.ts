// supabase/functions/get-available-chofers/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface PreApprovedUser {
  nome?: string;
  email: string;
  empresa: string;
  permission_type: string;
  status: string;
  area_atuacao: string[];
}

// Helper function to extract city from origin string
function extractCityFromOrigin(origem: string): string {
  if (!origem) return ''

  const patterns = [
    /^([^-]+)\s*-\s*[A-Z]{2}$/i,
    /^([^/]+)\s*\/\s*[A-Z]{2}$/i,
    /^([^,]+)\s*,\s*[A-Z]{2}$/i,
    /^([^-,/]+)/i
  ]

  for (const pattern of patterns) {
    const match = origem.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return origem.trim()
}

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { empresaResponsavel, origemLocacao } = await req.json()

    if (!empresaResponsavel || !origemLocacao) {
      return new Response(JSON.stringify({ error: 'empresaResponsavel and origemLocacao are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      // { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      // NOTE: We are intentionally NOT passing the user's auth context here.
      // This function is designed to be called from a trusted backend (the Next.js API route)
      // and needs to use the service role key to bypass RLS.
    )

    // The function will use the service role key from the environment.
    const { data, error } = await supabaseClient
      .from('pre_approved_users')
      .select('nome, email, empresa, permission_type, status, area_atuacao')
      .eq('empresa', empresaResponsavel)
      .eq('permission_type', 'chofer')
      .eq('status', 'active')

    if (error) {
      throw error
    }

    if (!data) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const cardCity = extractCityFromOrigin(origemLocacao).toLowerCase();
    const filteredUsers = data.filter((user: PreApprovedUser) => {
      if (!user.area_atuacao || !Array.isArray(user.area_atuacao)) return false;
      return user.area_atuacao.some((area: string) => {
        const areaCity = area.toLowerCase();
        return cardCity.includes(areaCity) || areaCity.includes(cardCity) || cardCity === areaCity;
      });
    });

    return new Response(JSON.stringify(filteredUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
