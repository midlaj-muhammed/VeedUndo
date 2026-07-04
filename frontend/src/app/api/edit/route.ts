import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const HOUSE_TYPES = ["1bhk", "2bhk", "3bhk", "villa", "studio", "other"];

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: { user }, error: authErr } = await supabase.auth.getUser(auth);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { listing_id, rent_min, rent_max, house_type, description, poster_phone, poster_whatsapp } = body;

  if (!listing_id || typeof listing_id !== "string") {
    return NextResponse.json({ error: "listing_id required" }, { status: 400 });
  }

  // Validate editable fields
  const update: Record<string, unknown> = {};

  if (rent_min !== undefined) {
    const v = Number(rent_min);
    if (isNaN(v) || v < 0) return NextResponse.json({ error: "rent_min must be a non-negative number" }, { status: 400 });
    update.rent_min = v;
  }
  if (rent_max !== undefined) {
    const v = Number(rent_max);
    if (isNaN(v) || v < 0) return NextResponse.json({ error: "rent_max must be a non-negative number" }, { status: 400 });
    update.rent_max = v;
  }
  if (house_type !== undefined) {
    if (!HOUSE_TYPES.includes(house_type)) {
      return NextResponse.json({ error: `house_type must be one of: ${HOUSE_TYPES.join(", ")}` }, { status: 400 });
    }
    update.house_type = house_type;
  }
  if (description !== undefined) {
    if (typeof description !== "string" || description.length > 2000) {
      return NextResponse.json({ error: "description must be a string under 2000 characters" }, { status: 400 });
    }
    update.description = description;
  }
  if (poster_phone !== undefined) {
    if (typeof poster_phone !== "string" || poster_phone.length > 15) {
      return NextResponse.json({ error: "poster_phone must be a string under 15 characters" }, { status: 400 });
    }
    update.poster_phone = poster_phone;
  }
  if (poster_whatsapp !== undefined) {
    if (typeof poster_whatsapp !== "string" || poster_whatsapp.length > 15) {
      return NextResponse.json({ error: "poster_whatsapp must be a string under 15 characters" }, { status: 400 });
    }
    update.poster_whatsapp = poster_whatsapp;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // RLS ensures poster_email matches auth.email()
  const { error: updateErr } = await supabase
    .from("listings")
    .update(update)
    .eq("id", listing_id)
    .eq("poster_email", user.email!);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
