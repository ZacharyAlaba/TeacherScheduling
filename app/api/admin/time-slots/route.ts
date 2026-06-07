import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let timeSlots: Array<{
      id: string;
      day: string;
      startTime: string;
      endTime: string;
      createdAt?: Date | null;
      updatedAt?: Date;
    }> = await prisma.timeSlot.findMany({
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    if (timeSlots.length === 0) {
      timeSlots = await loadTimeSlotsFromCsv();
    }

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("TimeSlots fetch error:", error);
    try {
      const timeSlots = await loadTimeSlotsFromCsv();
      return NextResponse.json(timeSlots);
    } catch (csvError) {
      console.error("TimeSlots CSV fallback error:", csvError);
      return NextResponse.json([]);
    }
  }
}

async function loadTimeSlotsFromCsv() {
  const csvPath = path.resolve(process.cwd(), "..", "data", "time_slots.csv");
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).map((line, index) => {
    const [day, startTime, endTime] = line.split(",").map((value) => value.trim());
    return {
      id: `csv-time-slot-${index + 1}`,
      day,
      startTime,
      endTime,
      createdAt: null,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { day, startTime, endTime } = await request.json();

    if (!day || !startTime || !endTime) {
      return NextResponse.json({ error: "Day, startTime, and endTime required" }, { status: 400 });
    }

    const timeSlot = await prisma.timeSlot.create({
      data: { day, startTime, endTime },
    });

    return NextResponse.json(timeSlot, { status: 201 });
  } catch (error) {
    console.error("TimeSlot creation error:", error);
    return NextResponse.json({ error: "Failed to create time slot" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, day, startTime, endTime } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "TimeSlot ID required" }, { status: 400 });
    }

    const timeSlot = await prisma.timeSlot.update({
      where: { id },
      data: {
        ...(day && { day }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
      },
    });

    return NextResponse.json(timeSlot);
  } catch (error) {
    console.error("TimeSlot update error:", error);
    return NextResponse.json({ error: "Failed to update time slot" }, { status: 500 });
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
      return NextResponse.json({ error: "TimeSlot ID required" }, { status: 400 });
    }

    await prisma.timeSlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("TimeSlot deletion error:", error);
    return NextResponse.json({ error: "Failed to delete time slot" }, { status: 500 });
  }
}
