
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { connection, NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
  "Food",
  "Shopping",
  "Transportation",
  "Stationery",
  "Bills",
  "Entertainment",
];

export async function GET() {
  await connection();

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await prisma.$transaction(
      DEFAULT_CATEGORIES.map((name) =>
        prisma.category.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Category API error:", error);

    return NextResponse.json(
      { error: "Unable to load categories" },
      { status: 500 }
    );
  }
}
