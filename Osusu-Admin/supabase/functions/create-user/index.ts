import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('PROJECT_URL'),
  Deno.env.get('SERVICE_ROLE_KEY')
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Change this to your domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // ✅ Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('OK', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('PROJECT_URL'),
      Deno.env.get('ANON_KEY'),
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const {
      data: { user }
    } = await supabase.auth.getUser()

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .eq('verified', true)
      .maybeSingle()

    if (adminError || !adminData) {
      return new Response(JSON.stringify({ error: 'Access denied: not a verified admin' }), {
        status: 403,
        headers: corsHeaders
      })
    }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: corsHeaders
      })
    }

    return new Response(JSON.stringify({ user: createdUser.user }), {
      status: 201,
      headers: corsHeaders
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    })
  }
})
