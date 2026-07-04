import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: { user }, error: authErr } = await supabase.auth.getUser(auth);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id } = await req.json();
  if (!listing_id || typeof listing_id !== "string") {
    return NextResponse.json({ error: "listing_id required" }, { status: 400 });
  }

  // Atomic delete: RLS ensures poster_email matches auth.email()
  const { error: delErr } = await supabase
    .from("listings")
    .delete()
    .eq("id", listing_id)
    .eq("poster_email", user.email!);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
