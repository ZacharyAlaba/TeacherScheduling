import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; name: string; error: string }>;
  created: Array<{ name: string; email: string }>;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return new Response(JSON.stringify({ error: "Only CSV files are supported" }), { status: 400 });
    }

    const fileContent = await file.text();
    const lines = fileContent.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      return new Response(JSON.stringify({ error: "CSV file is empty" }), { status: 400 });
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIndex = headers.indexOf("name");
    const emailIndex = headers.indexOf("email");

    if (nameIndex === -1 || emailIndex === -1) {
      return new Response(
        JSON.stringify({ error: "CSV must have columns: name, email" }),
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      created: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const row = i + 1;
      const values = lines[i].split(",").map((v) => v.trim());

      if (values.length < 2) continue;

      const name = values[nameIndex];
      const email = values[emailIndex];

      try {
        if (!name || !email) {
          throw new Error("Name and email are required");
        }

        if (!email.includes("@")) {
          throw new Error("Invalid email format");
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error("Email already exists in system");
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "TEACHER",
            teacher: { create: {} },
          },
        });

        result.created.push({ name, email });
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row,
          name: name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Failed to import teachers:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to import teachers" }),
      { status: 500 }
    );
  }
}
