
import { prisma } from "@/lib/prisma";
import { connection, NextResponse } from "next/server";

export async function GET() {
  await connection();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "unavailable",
      },
      { status: 503 }
    );
  }
}
