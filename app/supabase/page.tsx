import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Supabase Demo</p>
        <h1 className="mt-2 text-3xl font-semibold">Todos from Supabase</h1>
        <ul className="mt-6 space-y-3">
          {todos?.map((todo: any) => (
            <li key={todo.id} className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3">
              {todo.name}
            </li>
          ))}
          {!todos?.length && (
            <li className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-slate-400">
              No todos found. Create a todos table in Supabase to see items here.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
