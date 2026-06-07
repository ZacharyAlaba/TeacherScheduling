"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminSidebar() {
  const router = useRouter();

  const navItems = [
    { label: "Overview", href: "/admin", icon: "overview", color: "bg-blue-500" },
    { label: "Schedule Builder", href: "/admin/schedule-builder", icon: "calendar", color: "bg-red-500" },
    { label: "Teachers", href: "/admin/teachers", icon: "users", color: "bg-green-500" },
    { label: "Subjects", href: "/admin/subjects", icon: "book", color: "bg-purple-500" },
    { label: "Sections", href: "/admin/sections", icon: "building", color: "bg-yellow-500" },
    { label: "Students", href: "/admin/students", icon: "graduation", color: "bg-cyan-500" },
  ];

  const settingsItems = [
    { label: "Time Slots", href: "/admin/time-slots", icon: "clock", color: "bg-indigo-500" },
    { label: "Workload", href: "/admin/workload", icon: "chart", color: "bg-pink-500" },
  ];

  return (
    <aside className="hidden md:block">
      <div className="sticky top-6 w-64 rounded-lg border border-slate-700 bg-slate-800 p-4">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">LS</div>
        </div>

        {/* Admin User Badge */}
        <div className="mb-6 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin User</p>
          <p className="text-sm font-medium text-white mt-1">AU</p>
        </div>

        {/* Navigation Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">NAVIGATION</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700/50 transition-all group"
              >
                <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Settings Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">SETTINGS</p>
          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700/50 transition-all"
              >
                <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-slate-700 pt-4 space-y-2">
          <button
            onClick={() => router.push('/admin/teachers')}
            className="w-full rounded-lg bg-slate-700/50 hover:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-all"
          >
            Manage Data
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full rounded-lg border border-slate-700 hover:border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
