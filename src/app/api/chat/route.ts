import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase-auth";
import { askAI } from "@/lib/ai-rag";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await askAI(message, user?.id);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}