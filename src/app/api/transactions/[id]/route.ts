
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

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
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !Object.prototype.hasOwnProperty.call(
      body,
      "categoryId"
    )
  ) {
    return NextResponse.json(
      { error: "categoryId is required" },
      { status: 400 }
    );
  }

  const { categoryId } = body as {
    categoryId: unknown;
  };

  if (
    categoryId !== null &&
    (typeof categoryId !== "string" ||
      categoryId.trim().length === 0)
  ) {
    return NextResponse.json(
      { error: "Invalid categoryId" },
      { status: 400 }
    );
  }

  try {
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

    const result = await prisma.transaction.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        categoryId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      status: "ok",
      transaction,
    });
  } catch (error) {
    console.error("Category update failed:", error);

    return NextResponse.json(
      { error: "Unable to update category" },
      { status: 500 }
    );
  }
}
