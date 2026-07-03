import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { locality_id, house_type, rent_min, rent_max } = await request.json();

  // Validate inputs
  if (!locality_id || !house_type || typeof rent_min !== "number" || typeof rent_max !== "number") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  if (rent_min < 0 || rent_max < 0 || rent_min > 1000000 || rent_max > 1000000 || rent_min > rent_max) {
    return NextResponse.json({ error: "Invalid rent range" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: matches, error } = await supabase
    .from("listings")
    .select("id, rent_min, rent_max, locality_id, house_type")
    .eq("status", "active")
    .eq("locality_id", locality_id)
    .eq("house_type", house_type)
    .gte("expires_at", new Date().toISOString())
    .or(`and(rent_min.lte.${rent_max},rent_max.gte.${rent_min})`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ matches: matches || [], count: matches?.length || 0 });
}
