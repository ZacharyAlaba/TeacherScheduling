import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeSubjectName } from "@/lib/normalizeSubjectName";
import { validateSectionSubjectPlacement, WEEKDAYS } from "@/lib/schedulingRules";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await prisma.scheduleBlock.findMany({
      include: {
        teacher: { include: { user: true } },
        subject: true,
        section: true,
        timeSlot: true,
      },
      orderBy: [{ timeSlot: { day: "asc" } }, { timeSlot: { startTime: "asc" } }],
    });

    return NextResponse.json(
      schedules.map((schedule: any) => ({
        ...schedule,
        subject: {
          ...schedule.subject,
          name: normalizeSubjectName(schedule.subject.name),
        },
      }))
    );
  } catch (error) {
    console.error("Schedules fetch error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherId, subjectId, sectionId, timeSlotId, room, overrideRules, overrideReason } = await request.json();

    if (!teacherId || !subjectId || !sectionId || !timeSlotId) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (overrideRules && !overrideReason?.trim()) {
      return NextResponse.json({ error: "Override reason required" }, { status: 400 });
    }

    // Check for conflicts
    const existingTeacherConflict = await prisma.scheduleBlock.findFirst({
      where: {
        teacherId,
        timeSlotId,
      },
    });

    const existingSectionConflict = await prisma.scheduleBlock.findFirst({
      where: {
        sectionId,
        timeSlotId,
      },
    });

    if (existingTeacherConflict) {
      return NextResponse.json({ error: "Teacher already has a class at this time" }, { status: 400 });
    }

    if (existingSectionConflict) {
      return NextResponse.json({ error: "Section already has a class at this time" }, { status: 400 });
    }

    // Rule checks (only bypassable with override)
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const timeSlot = await prisma.timeSlot.findUnique({ where: { id: timeSlotId } });

    if (!subject || !timeSlot) {
      return NextResponse.json({ error: "Invalid subject or time slot" }, { status: 400 });
    }

    if (!overrideRules) {
      const sectionSubjectSchedules = await prisma.scheduleBlock.findMany({
        where: {
          sectionId,
          subjectId,
        },
        include: {
          timeSlot: true,
        },
      });

      const placementValidation = validateSectionSubjectPlacement(
        subject.name,
        sectionSubjectSchedules.map((s: any) => ({ day: s.timeSlot.day })),
        timeSlot.day
      );

      if (!placementValidation.valid) {
        return NextResponse.json({ error: placementValidation.error }, { status: 400 });
      }

      const teacherSchedules = await prisma.scheduleBlock.findMany({
        where: { teacherId },
        include: { timeSlot: true },
      });

      const daysUsed = new Set(teacherSchedules.map((s: any) => s.timeSlot.day));
      daysUsed.add(timeSlot.day);

      const hasDayOff = WEEKDAYS.some((day) => !daysUsed.has(day));
      if (!hasDayOff) {
        return NextResponse.json(
          { error: "Teacher must have at least one day off" },
          { status: 400 }
        );
      }
    }

    // Qualification check: ensure teacher is qualified to teach this subject
    const qualification = await prisma.teacherQualification.findFirst({
      where: { teacherId, subjectId },
    });

    if (!qualification && !overrideRules) {
      return NextResponse.json({ error: "Teacher is not qualified for this subject" }, { status: 400 });
    }

    const schedule = await prisma.scheduleBlock.create({
      data: {
        teacherId,
        subjectId,
        sectionId,
        timeSlotId,
        room: room || undefined,
      },
      include: {
        teacher: { include: { user: true } },
        subject: true,
        section: true,
        timeSlot: true,
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Schedule creation error:", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, teacherId, subjectId, sectionId, timeSlotId, room } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    const schedule = await prisma.scheduleBlock.update({
      where: { id },
      data: {
        ...(teacherId && { teacherId }),
        ...(subjectId && { subjectId }),
        ...(sectionId && { sectionId }),
        ...(timeSlotId && { timeSlotId }),
        ...(room !== undefined && { room: room || null }),
      },
      include: {
        teacher: { include: { user: true } },
        subject: true,
        section: true,
        timeSlot: true,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Schedule update error:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
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
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 });
    }

    await prisma.scheduleBlock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Schedule deletion error:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
