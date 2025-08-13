import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();

    const {
      email,
      password,
      full_name,
      phone_number,
      nin,
      role = "admin",
      privileges = {},
      created_by = null,
      address = null,
      avatar_url = null,
      status = "active"
    } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields", 
          required: ["email", "password", "full_name"] 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Initialize Supabase client - Use SERVICE_ROLE_KEY for admin operations
    const supabase = createClient(
      Deno.env.get('PROJECT_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')! // Changed from ANON_KEY to SERVICE_ROLE_KEY
    );

    // 1. Create auth user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role
      }
    });

    if (userError || !user.user) {
      console.error('Auth user creation failed:', userError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create auth user", 
          details: userError?.message || "Unknown error" 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const userId = user.user.id;

    // 2. Insert into admins table - Fixed to match your schema exactly
    const { error: adminError } = await supabase
      .from("admins")
      .insert([
        {
          id: userId,        // Changed from 'id' to 'uuid' to match your schema
          role,               // text field
          verified: false,    // boolean field
          privileges,         // jsonb field
          status,            // text field
          created_by,        // uuid field (can be null)
          created_at: new Date().toISOString() // timestamp field
        }
      ]);

    if (adminError) {
      console.error('Admin record insertion failed:', adminError);
      
      // Cleanup: Delete the auth user if admin record creation fails
      await supabase.auth.admin.deleteUser(userId);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to insert admin record", 
          details: adminError.message 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 3. Insert into admin_profiles
    const { error: profileError } = await supabase
      .from("admin_profiles")
      .insert([
        {
          id: userId,
          full_name,
          phone_number: phone_number || '', // Ensure it's not null
          email,
          nin: nin || null,
          address: address || null,
          avatar_url: avatar_url || null,
          created_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.error('Admin profile insertion failed:', profileError);
      
      // Cleanup: Delete admin record and auth user
      await supabase.from("admins").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to insert admin profile", 
          details: profileError.message 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 4. Log admin creation action (if admin_actions table exists)
    if (created_by) {
      const { error: actionError } = await supabase
        .from("admin_actions")
        .insert([
          {
            admin_id: created_by,
            entity_type: "admin",
            entity_id: userId,
            action: "create_admin",
            timestamp: new Date().toISOString()
          }
        ]);

      if (actionError) {
        console.warn('Failed to log admin action:', actionError);
        // Don't fail the entire operation for logging issues
      }
    }

    // 5. Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin created successfully",
        data: {
          user_id: userId,
          email,
          full_name,
          role,
          status,
          verified: false,
          privileges
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-admin function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
