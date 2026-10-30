import { NextResponse } from "next/server";
import { listInternshipPrograms } from "@/lib/internships/service";

export async function GET() {
  try {
    const programs = await listInternshipPrograms();
    return NextResponse.json({ programs });
  } catch (error: any) {
    console.error("Failed to list internship programs:", error);
    return NextResponse.json(
      { error: "Failed to list internship programs", details: error.message },
      { status: 500 }
    );
  }
}
