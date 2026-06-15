/**
 * Supabase-compatible admin students route
 * Replace app/api/admin/students/route.ts with this version
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get all students with their user and section info
    const { data: students, error } = await supabase
      .from("Student")
      .select(`
        id,
        userId,
        studentId,
        gradeLevel,
        sectionId,
        createdAt,
        User(id, name, email),
        Section(id, name, gradeLevel, track)
      `)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    const formattedStudents = (students || []).map((student: any) => ({
      id: student.id,
      studentId: student.studentId,
      name: student.User?.name,
      email: student.User?.email,
      gradeLevel: student.gradeLevel,
      sectionId: student.sectionId,
      section: student.Section,
      createdAt: student.createdAt,
    }));

    return new Response(JSON.stringify(formattedStudents), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch students" }),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      name,
      email,
      password,
      gradeLevel,
      sectionId,
      dateOfBirth,
      gender,
      phone,
      address,
      guardianName,
      guardianPhone,
    } = body;

    if (!name || !email || !gradeLevel || !sectionId || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Generate student ID if not provided
    let finalStudentId = studentId;
    if (!finalStudentId) {
      const { data: existingStudents } = await supabase
        .from("Student")
        .select("studentId")
        .eq("gradeLevel", gradeLevel)
        .order("studentId", { ascending: false })
        .limit(1);

      const lastId = existingStudents?.[0]?.studentId || "0";
      const nextNum = parseInt(lastId.split("-")[1] || "0") + 1;
      finalStudentId = `${gradeLevel}-${String(nextNum).padStart(4, "0")}`;
    }

    // Check if student ID already exists
    const { data: existingStudentId } = await supabase
      .from("Student")
      .select("id")
      .eq("studentId", finalStudentId)
      .maybeSingle();

    if (existingStudentId) {
      return new Response(
        JSON.stringify({ error: "Student ID already exists" }),
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: "Email already exists" }),
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = nanoid();
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert([
        {
          id: userId,
          email,
          name,
          password: hashedPassword,
          role: "STUDENT",
        },
      ])
      .select()
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500 }
      );
    }

    // Create student profile
    const { data: student, error: studentError } = await supabase
      .from("Student")
      .insert([
        {
          id: nanoid(),
          userId: user.id,
          studentId: finalStudentId,
          gradeLevel,
          sectionId,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          phone: phone || null,
          address: address || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
        },
      ])
      .select()
      .single();

    if (studentError || !student) {
      // Clean up user if student creation fails
      await supabase.from("User").delete().eq("id", user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create student" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Student created successfully",
        student,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create student:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create student" }),
      { status: 500 }
    );
  }
}
