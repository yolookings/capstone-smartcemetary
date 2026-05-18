import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-auth";

export async function POST(req: Request) {
  try {
    const { email, password, name, telegramChatId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: name,
        role: 'USER'
      }
    });

    if (error) {
      console.error("Supabase Auth Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        email: email.toLowerCase(),
        full_name: name,
        role: 'USER'
      });

    if (profileError) {
      console.error("Profile creation error:", profileError.message);
    }

    if (telegramChatId) {
      await supabaseAdmin
        .from('profiles')
        .update({ telegram_chat_id: telegramChatId })
        .eq('id', data.user.id);
    }

    return NextResponse.json({ 
      message: "User berhasil terdaftar dan profil otomatis dibuat", 
      userId: data.user.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Registration logic error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
