import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fournisseurs } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [f] = await db.insert(fournisseurs).values(body).returning();
    return NextResponse.json({ ok: true, fournisseur: f });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
