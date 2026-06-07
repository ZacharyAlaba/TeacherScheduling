"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react"

interface Teacher {
  id: string;
  user: { name: string; email: string };
  createdAt: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [signupLinkCopied, setSignupLinkCopied] = useState(false);

  const signupUrl = typeof window !== 'undefined' ? `${window.location.origin}/signup` : '/signup';

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      const response = await fetch("/api/admin/teachers");
      if (response.ok) {
        setTeachers(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return; // Only allow editing, not creating
    
    try {
      const response = await fetch("/api/admin/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: editingId }),
      });

      if (response.ok) {
        setFormData({ name: "", email: "" });
        setEditingId(null);
        setShowForm(false);
        await fetchTeachers();
      }
    } catch (error) {
      console.error("Failed to update teacher:", error);
    }
  }

  function copySignupLink() {
    navigator.clipboard.writeText(signupUrl);
    setSignupLinkCopied(true);
    setTimeout(() => setSignupLinkCopied(false), 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this teacher?")) return;
    try {
      const response = await fetch(`/api/admin/teachers?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchTeachers();
      }
    } catch (error) {
      console.error("Failed to delete teacher:", error);
    }
  }

  function handleEdit(teacher: Teacher) {
    setFormData({ name: teacher.user.name, email: teacher.user.email });
    setEditingId(teacher.id);
    setShowForm(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">Teachers Management</h1>
            <p className="text-slate-400">View and manage all registered teachers</p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Logout
          </button>
        </div>

        {/* Info Banner - Teacher Self-Registration */}
        <div className="mb-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">👥</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">How to Add Teachers</h3>
              <p className="text-slate-300 mb-4">
                Teachers should register themselves using the signup page. Once they sign up, they will automatically appear in this list and you can assign them to classes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="flex-1 bg-slate-900/50 rounded-lg px-4 py-3 border border-slate-700 font-mono text-sm text-slate-300 break-all">
                  {signupUrl}
                </div>
                <button
                  onClick={copySignupLink}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold whitespace-nowrap transition"
                >
                  {signupLinkCopied ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Share this link with teachers so they can create their accounts
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form (only shows when editing) */}
        {showForm && editingId && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Edit Teacher</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: "", email: "" });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Update Teacher
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teachers Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {!loading && teachers.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
              <h3 className="text-lg font-bold text-white">
                Registered Teachers <span className="text-slate-400 font-normal">({teachers.length})</span>
              </h3>
            </div>
          )}
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-white mb-2">No Teachers Yet</h3>
              <p className="text-slate-400 mb-4">
                Teachers who sign up will automatically appear here.
              </p>
              <p className="text-sm text-slate-500">
                Share the signup link above to invite teachers to register.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Created</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-6 py-3 text-white">{teacher.user.name}</td>
                    <td className="px-6 py-3 text-slate-400">{teacher.user.email}</td>
                    <td className="px-6 py-3 text-slate-400">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
