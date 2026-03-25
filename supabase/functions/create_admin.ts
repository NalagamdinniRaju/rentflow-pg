// Deno Edge Function to create a PG admin without sending verification email
import { createClient } from '@supabase/supabase-js';

// The service role key should be set as an environment variable in Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

export async function handler(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();
    // Create auth user and mark email as confirmed
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });
    if (authErr) throw authErr;

    // Insert role record
    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({
        user_id: authUser.user.id,
        role: "ADMIN",
        name,
        phone,
        email,
        status: "ACTIVE"
      });
    if (roleErr) throw roleErr;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    const err = e as Error;
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}
