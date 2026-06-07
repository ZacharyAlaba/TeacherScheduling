import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ScheduleItem = {
  day: string;
  timeSlot: string;
  subject: string;
  section: string;
  room: string | null;
};

type TimeSlotItem = {
  startTime: string;
  endTime: string;
};

const demoSchedule: ScheduleItem[] = [
  {
    day: "Monday",
    timeSlot: "09:30 AM-10:30 AM",
    subject: "Oral Communication",
    section: "G11 - HUMSS A",
    room: "SHS-201",
  },
  {
    day: "Wednesday",
    timeSlot: "09:30 AM-10:30 AM",
    subject: "Oral Communication",
    section: "G11 - HUMSS A",
    room: "SHS-201",
  },
  {
    day: "Tuesday",
    timeSlot: "01:30 PM-02:30 PM",
    subject: "Practical Research 1",
    section: "G11 - HUMSS B",
    room: "SHS-203",
  },
  {
    day: "Thursday",
    timeSlot: "01:30 PM-02:30 PM",
    subject: "Practical Research 1",
    section: "G11 - HUMSS B",
    room: "SHS-203",
  },
  {
    day: "Friday",
    timeSlot: "03:30 PM-04:30 PM",
    subject: "Reading and Writing",
    section: "G12 - HUMSS A",
    room: "SHS-205",
  },
];

const demoTimeSlots: TimeSlotItem[] = [
  { startTime: "07:30 AM", endTime: "08:30 AM" },
  { startTime: "08:30 AM", endTime: "09:30 AM" },
  { startTime: "09:30 AM", endTime: "10:30 AM" },
  { startTime: "10:30 AM", endTime: "11:30 AM" },
  { startTime: "11:30 AM", endTime: "12:30 PM" },
  { startTime: "12:30 PM", endTime: "01:30 PM" },
  { startTime: "01:30 PM", endTime: "02:30 PM" },
  { startTime: "02:30 PM", endTime: "03:30 PM" },
  { startTime: "03:30 PM", endTime: "04:30 PM" },
  { startTime: "04:30 PM", endTime: "05:30 PM" },
];

function formatTimeForDisplay(value: string) {
  const normalized = value.trim();
  if (/am|pm/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return normalized;
  }

  const hour24 = Number(match[1]);
  const minute = match[2];
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minute} ${suffix}`;
}

function timeToMinutes(value: string) {
  const normalized = value.trim().toUpperCase();
  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]) % 12;
    const minute = Number(ampmMatch[2]);
    if (ampmMatch[3] === "PM") {
      hour += 12;
    }
    return hour * 60 + minute;
  }

  const hhmmMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    return Number(hhmmMatch[1]) * 60 + Number(hhmmMatch[2]);
  }

  return 0;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "STUDENT") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    // Handle Student Request
    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          section: true,
        },
      });

      if (!student) {
        return NextResponse.json({ message: "Student not found" }, { status: 404 });
      }

      const schedule = await prisma.scheduleBlock.findMany({
        where: {
          sectionId: student.sectionId,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              track: true,
            },
          },
          timeSlot: {
            select: {
              id: true,
              day: true,
              startTime: true,
              endTime: true,
            },
          },
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [
          { timeSlot: { day: "asc" } },
          { timeSlot: { startTime: "asc" } },
        ],
      });

      return NextResponse.json({
        studentId: student.studentId,
        name: student.user.name,
        email: student.user.email,
        gradeLevel: student.gradeLevel,
        section: student.section,
        schedule,
      });
    }

    // Handle Teacher Request
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        scheduleBlocks: {
          include: {
            subject: true,
            timeSlot: true,
            section: true,
          },
        },
      },
    });

    const allTimeSlots = await prisma.timeSlot.findMany();

    const schedule: ScheduleItem[] =
      teacher?.scheduleBlocks.map((block) => ({
        day: block.timeSlot.day,
        timeSlot: `${formatTimeForDisplay(block.timeSlot.startTime)}-${formatTimeForDisplay(block.timeSlot.endTime)}`,
        subject: block.subject.name,
        section: block.section.name,
        room: block.room,
      })) ?? [];

    const sourceTimeSlots =
      allTimeSlots.length > 0
        ? allTimeSlots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          }))
        : teacher?.scheduleBlocks.map((block) => ({
            startTime: block.timeSlot.startTime,
            endTime: block.timeSlot.endTime,
          })) ?? [];

    const uniqueSlots = new Map<string, TimeSlotItem>();
    for (const slot of sourceTimeSlots) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!uniqueSlots.has(key)) {
        uniqueSlots.set(key, {
          startTime: formatTimeForDisplay(slot.startTime),
          endTime: formatTimeForDisplay(slot.endTime),
        });
      }
    }

    const timeSlots = Array.from(uniqueSlots.values()).sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    return NextResponse.json({ schedule, timeSlots, source: "database" });
  } catch {
    return NextResponse.json(
      { schedule: demoSchedule, timeSlots: demoTimeSlots, source: "demo" },
      { status: 200 }
    );
  }
}