
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        category: true,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    return NextResponse.json({
      status: "ok",
      transactions,
    });
  } catch (error) {
    console.error("GET transactions error:", error);

    return NextResponse.json(
      { error: "Unable to load transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;

    const description = input.description;
    const amountMinor = input.amountMinor;
    const categoryId = input.categoryId;

    if (
      typeof description !== "string" ||
      description.trim().length === 0 ||
      description.trim().length > 200
    ) {
      return NextResponse.json(
        { error: "Description must contain 1–200 characters" },
        { status: 400 }
      );
    }

    if (
      typeof amountMinor !== "number" ||
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0 ||
      amountMinor > 100000000
    ) {
      return NextResponse.json(
        { error: "Invalid amount in USD cents" },
        { status: 400 }
      );
    }

    if (
      categoryId !== undefined &&
      categoryId !== null &&
      (typeof categoryId !== "string" ||
        categoryId.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    if (typeof categoryId === "string") {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        description: description.trim(),
        amountMinor,
        currency: "USD",
        source: "MANUAL",
        status: "COMPLETED",
        ...(typeof categoryId === "string"
          ? { categoryId }
          : {}),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      {
        status: "ok",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST transactions error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create transaction" },
      { status: 500 }
    );
  }
}
