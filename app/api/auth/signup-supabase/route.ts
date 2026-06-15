/**
 * Supabase-compatible signup route
 * Replace app/api/auth/signup/route.ts with this version
 */

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body as {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    };

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { message: "Email is already registered." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with generated ID
    const userId = nanoid();
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert([
        {
          id: userId,
          name,
          email,
          password: hashedPassword,
          role: "TEACHER",
        },
      ])
      .select()
      .single();

    if (userError || !user) {
      console.error("User creation error:", userError);
      throw new Error("Failed to create user");
    }

    // Create teacher profile
    const { error: teacherError } = await supabase
      .from("Teacher")
      .insert([
        {
          id: nanoid(),
          userId: user.id,
        },
      ]);

    if (teacherError) {
      // Clean up user if teacher creation fails
      await supabase.from("User").delete().eq("id", user.id);
      console.error("Teacher creation error:", teacherError);
      throw new Error("Failed to create teacher profile");
    }

    return NextResponse.json(
      { message: "Signup successful." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
