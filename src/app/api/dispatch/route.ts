import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ error: "Field messaging is paused. Coming later.", code: "FEATURE_PAUSED" }, { status: 501 }); }
