"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

type LoginFormProps = {
  role: UserRole;
};

export default function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "ADMIN";
  const isTeacher = role === "TEACHER";
  const isStudent = role === "STUDENT";

  const getErrorMessage = () => {
    if (isAdmin) return "Invalid admin account or password";
    if (isTeacher) return "Invalid teacher account or password";
    return "Invalid student ID or password";
  };

  const getPlaceholder = () => {
    if (isAdmin) return "admin@school.edu";
    if (isTeacher) return "teacher@school.edu";
    return "Student ID (e.g., STU001)";
  };

  const getLabel = () => {
    if (isAdmin) return "Email address";
    if (isTeacher) return "Email address";
    return "Student ID";
  };

  const getRoleDescription = () => {
    if (isAdmin)
      return "Administrator access for managing sections, schedules, and teacher assignments.";
    if (isTeacher)
      return "Teacher access for viewing your class programs and weekly timetable.";
    return "Student access for viewing your class schedule and enrolled sections.";
  };

  const getButtonText = () => {
    if (isAdmin) return "Continue as Admin";
    if (isTeacher) return "Continue as Teacher";
    return "Continue as Student";
  };

  const getTitle = () => {
    if (isAdmin) return "Sign in as Administrator";
    if (isTeacher) return "Sign in as Teacher";
    return "Sign in as Student";
  };

  const getLoginType = () => {
    if (isAdmin) return "Admin Login";
    if (isTeacher) return "Teacher Login";
    return "Student Login";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError(getErrorMessage());
        setLoading(false);
        return;
      }

      if (isAdmin) {
        router.push("/admin");
      } else if (isTeacher) {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
          <section className="flex flex-col justify-between bg-indigo-700 p-8 text-white md:p-10">
            <div>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
                LN
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                Libertad National High School
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
                Senior High School Scheduling Portal
              </h1>
              <p className="mt-4 max-w-md text-indigo-100">
                {getRoleDescription()}
              </p>
            </div>
            <p className="mt-8 text-sm text-indigo-100">School year schedule management system</p>
          </section>

          <section className="p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {getLoginType()}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {getTitle()}
            </h2>
            <p className="mt-2 text-sm text-slate-600">Enter your account credentials to continue.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-700">
                {getLabel()}
              </label>
              <input
                id="identifier"
                type={isStudent ? "text" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500"
                placeholder={getPlaceholder()}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60"
            >
              {loading ? "Signing in..." : getButtonText()}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-600">
            <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-600">
              ← Back to role selection
            </Link>
            {isTeacher && (
              <p>
                New teacher?{" "}
                <Link href="/signup" className="font-semibold text-indigo-700 hover:text-indigo-600">
                  Create an account
                </Link>
              </p>
            )}
          </div>
          </section>
        </div>
      </div>
    </div>
  );
}