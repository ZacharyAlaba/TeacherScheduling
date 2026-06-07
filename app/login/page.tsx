import Link from "next/link";

export default function LoginPage() {
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
                One place for Senior High School class scheduling, teacher assignment, and timetable access.
              </p>
            </div>
            <p className="mt-8 text-sm text-indigo-100">School year schedule management system</p>
          </section>

          <section className="p-8 md:p-10">
            <p className="text-sm font-medium text-slate-600">Choose login type</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">Select the portal that matches your account.</p>

            <div className="mt-8 space-y-4">
              <Link
                href="/login/admin"
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-300"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Admin Portal</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">Sign in as Administrator</p>
                <p className="mt-1 text-sm text-slate-600">Manage sections, subject loads, and schedule assignments.</p>
              </Link>

              <Link
                href="/login/teacher"
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-300"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">Teacher Portal</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">Sign in as Teacher</p>
                <p className="mt-1 text-sm text-slate-600">View your class schedules and weekly teaching load.</p>
              </Link>

              <Link
                href="/login/student"
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-green-300"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-600">Student Portal</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">Sign in as Student</p>
                <p className="mt-1 text-sm text-slate-600">View your class schedule and enrolled sections.</p>
              </Link>
            </div>

            <p className="mt-7 text-sm text-slate-600">
              New teacher?{" "}
              <Link href="/signup" className="font-semibold text-indigo-700 hover:text-indigo-600">
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
