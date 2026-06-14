import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
        include: {
          user: { select: { name: true, email: true } },
          qualifications: { select: { subjectId: true } },
        },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Teachers fetch error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user and teacher
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "TEACHER",
        teacher: { create: {} },
      },
      include: { teacher: true },
    });

    // Return teacher with password (only shown to admin on creation)
    return NextResponse.json({
      ...user.teacher,
      password: tempPassword,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Teacher creation error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, email } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Update user details
    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher update error:", error);
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Delete user (cascade will delete teacher)
    await prisma.user.delete({
      where: { id: teacher.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher deletion error:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
