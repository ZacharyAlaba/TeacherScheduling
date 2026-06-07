"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <header className="border-b border-slate-700 bg-slate-900/50">
      <div className="mx-auto max-w-[1600px] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                LS
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Libertad NHS Senior High
                </p>
                <p className="text-sm font-medium text-white">Admin Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
