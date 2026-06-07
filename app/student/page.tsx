"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Subject {
  id: string;
  name: string;
  gradeLevel: string;
  track?: string;
}

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface Teacher {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface ScheduleBlock {
  id: string;
  subject: Subject;
  timeSlot: TimeSlot;
  room?: string;
  teacher: Teacher;
}

interface Section {
  id: string;
  name: string;
  gradeLevel: string;
  track: string;
}

interface StudentData {
  studentId: string;
  name: string;
  email: string;
  gradeLevel: string;
  section: Section;
  schedule: ScheduleBlock[];
}

export default function StudentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "STUDENT") {
      fetchStudentData();
    }
  }, [session]);

  async function fetchStudentData() {
    try {
      const response = await fetch("/api/teacher/schedule");
      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
      }
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    } finally {
      setLoading(false);
    }
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const getDaySchedule = (day: string) => {
    if (!studentData) return [];
    return studentData.schedule
      .filter((block) => block.timeSlot.day === day)
      .sort((a, b) => a.timeSlot.startTime.localeCompare(b.timeSlot.startTime));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Student Dashboard</h1>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Sign Out
            </button>
          </div>
          <div className="text-white text-center py-12">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome, {studentData.name}</h1>
            <p className="text-slate-400">Student ID: {studentData.studentId}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Sign Out
          </button>
        </div>

        <div className="mb-8 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div>
            <p className="text-sm text-slate-400">Need to review your academic records?</p>
            <p className="text-white font-medium">Grades and report-card view are now available.</p>
          </div>
          <button
            onClick={() => router.push("/student/grades")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
          >
            View Grades
          </button>
        </div>

        {/* Student Info Card */}
        <div className="mb-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm">Section</p>
              <p className="text-2xl font-bold text-white mt-1">{studentData.section.name}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Grade Level</p>
              <p className="text-2xl font-bold text-white mt-1">{studentData.gradeLevel}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Track</p>
              <p className="text-2xl font-bold text-white mt-1">{studentData.section.track}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Email</p>
              <p className="text-white mt-1">{studentData.email}</p>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Weekly Schedule</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-5 gap-0 min-w-max">
              {days.map((day) => (
                <div key={day} className="flex-1 min-w-[300px] border-r border-slate-700 last:border-r-0">
                  <div className="bg-slate-700 p-4 border-b border-slate-600">
                    <h3 className="font-semibold text-white text-lg">{day}</h3>
                  </div>

                  <div className="p-4 space-y-3 min-h-[400px]">
                    {getDaySchedule(day).length === 0 ? (
                      <p className="text-slate-400 text-sm">No classes</p>
                    ) : (
                      getDaySchedule(day).map((block) => (
                        <div
                          key={block.id}
                          className="p-3 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg border border-blue-700 hover:border-blue-600 transition"
                        >
                          <p className="font-semibold text-white text-sm">{block.subject.name}</p>
                          <p className="text-blue-200 text-xs mt-1">
                            {block.timeSlot.startTime} - {block.timeSlot.endTime}
                          </p>
                          <p className="text-blue-300 text-xs mt-2">
                            Teacher: {block.teacher.user.name}
                          </p>
                          {block.room && (
                            <p className="text-blue-300 text-xs">Room: {block.room}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">All Classes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Day</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Teacher</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {studentData.schedule.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No schedule available
                    </td>
                  </tr>
                ) : (
                  studentData.schedule.map((block) => (
                    <tr key={block.id} className="hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4 text-sm text-white font-medium">{block.subject.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{block.timeSlot.day}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {block.timeSlot.startTime} - {block.timeSlot.endTime}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{block.teacher.user.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{block.room || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
