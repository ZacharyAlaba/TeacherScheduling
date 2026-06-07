import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all data
    const [teachers, subjects, sections, timeSlots, schedules] = await Promise.all([
      prisma.teacher.findMany({ include: { user: true } }),
      prisma.subject.findMany(),
      prisma.section.findMany(),
      prisma.timeSlot.findMany(),
      prisma.scheduleBlock.findMany({ include: { teacher: true, subject: true, section: true, timeSlot: true } }),
    ]);

    // Create CSV content
    let csv = `EXPORT_DATA\nLibertad National High School Senior High School\n${new Date().toISOString()}\n\n`;
    
    // Teachers
    csv += `TEACHERS\nID,Email,Name\n`;
    teachers.forEach((t: any) => {
      csv += `${t.id},"${t.user.email}","${t.user.name}"\n`;
    });
    csv += `\n`;

    // Subjects
    csv += `SUBJECTS\nID,Name,GradeLevel,Track\n`;
    subjects.forEach((s: any) => {
      csv += `${s.id},"${s.name}","${s.gradeLevel}","${s.track || ""}"\n`;
    });
    csv += `\n`;

    // Sections
    csv += `SECTIONS\nID,Name,GradeLevel,Track\n`;
    sections.forEach((s: any) => {
      csv += `${s.id},"${s.name}","${s.gradeLevel}","${s.track}"\n`;
    });
    csv += `\n`;

    // Time Slots
    csv += `TIME_SLOTS\nID,Day,StartTime,EndTime\n`;
    timeSlots.forEach((t: any) => {
      csv += `${t.id},"${t.day}","${t.startTime}","${t.endTime}"\n`;
    });
    csv += `\n`;

    // Schedules
    csv += `SCHEDULES\nTeacherEmail,Subject,Section,Day,StartTime,EndTime,Room\n`;
    schedules.forEach((s: any) => {
      csv += `"${s.teacher.user.email}","${s.subject.name}","${s.section.name}","${s.timeSlot.day}","${s.timeSlot.startTime}","${s.timeSlot.endTime}","${s.room || ""}"\n`;
    });

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="schedule_export_${new Date().getTime()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
