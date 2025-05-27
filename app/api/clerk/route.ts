import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId, sessionId } = await auth();
    if (!userId || !sessionId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error configuring Clerk JWT:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
} 