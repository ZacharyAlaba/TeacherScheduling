"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StudentItem = {
  id: string;
  studentId: string;
  name: string;
  email: string;
};

type SectionItem = {
  id: string;
  name: string;
  gradeLevel: string;
  track: string;
  students: StudentItem[];
};

type SubjectItem = {
  id: string;
  name: string;
  gradeLevel: string;
  track: string | null;
};

type GradeRecord = {
  id: string;
  studentId: string;
  subjectId: string;
  sectionId: string;
  gradingPeriod: string;
  academicYear: string;
  score: number;
  remarks?: string | null;
  student: {
    id: string;
    studentId: string;
    user: { name: string; email: string };
  };
  subject: {
    id: string;
    name: string;
  };
};

export default function TeacherGradesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [academicYear, setAcademicYear] = useState("");
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [gradingPeriod, setGradingPeriod] = useState("Quarter 1");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [remarksDrafts, setRemarksDrafts] = useState<Record<string, string>>({});
  const [savingStudentId, setSavingStudentId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login/teacher");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function loadGrades() {
      try {
        const response = await fetch("/api/teacher/grades", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        setAcademicYear(data.academicYear || "");
        setSections(data.sections || []);
        setSubjects(data.subjects || []);
        setGradeRecords(data.gradeRecords || []);

        const firstSection = data.sections?.[0];
        if (firstSection) {
          setSelectedSectionId((current) => current || firstSection.id);
        }
      } catch (error) {
        console.error("Failed to load grades:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGrades();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const selectedSection = sections.find((section) => section.id === selectedSectionId) || null;

  const availableSubjects = useMemo(() => {
    if (!selectedSection) {
      return subjects;
    }

    return subjects.filter((subject) => subject.gradeLevel === selectedSection.gradeLevel);
  }, [subjects, selectedSection]);

  useEffect(() => {
    if (!selectedSection) {
      return;
    }

    const hasSelectedSubject = availableSubjects.some((subject) => subject.id === selectedSubjectId);
    if (!hasSelectedSubject) {
      setSelectedSubjectId(availableSubjects[0]?.id || "");
    }
  }, [availableSubjects, selectedSection, selectedSubjectId]);

  const selectedStudents = selectedSection?.students || [];

  const recordLookup = useMemo(() => {
    const map = new Map<string, GradeRecord>();
    gradeRecords.forEach((record) => {
      const key = `${record.studentId}-${record.subjectId}-${record.gradingPeriod}`;
      map.set(key, record);
    });
    return map;
  }, [gradeRecords]);

  useEffect(() => {
    const nextScores: Record<string, string> = {};
    const nextRemarks: Record<string, string> = {};

    selectedStudents.forEach((student) => {
      const record = recordLookup.get(`${student.id}-${selectedSubjectId}-${gradingPeriod}`);
      if (record) {
        nextScores[student.id] = String(record.score);
        nextRemarks[student.id] = record.remarks || "";
      } else {
        nextScores[student.id] = "";
        nextRemarks[student.id] = "";
      }
    });

    setScoreDrafts(nextScores);
    setRemarksDrafts(nextRemarks);
  }, [selectedStudents, selectedSubjectId, gradingPeriod, recordLookup]);

  async function saveGrade(studentId: string) {
    if (!selectedSectionId || !selectedSubjectId || !selectedSection) {
      return;
    }

    const score = Number(scoreDrafts[studentId]);
    if (Number.isNaN(score)) {
      setMessage("Enter a valid score first.");
      return;
    }

    setSavingStudentId(studentId);
    setMessage("");

    try {
      const response = await fetch("/api/teacher/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          subjectId: selectedSubjectId,
          sectionId: selectedSectionId,
          gradingPeriod,
          score,
          remarks: remarksDrafts[studentId] || "",
          academicYear,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Failed to save grade");
        return;
      }

      setGradeRecords((current) => {
        const next = current.filter(
          (record) =>
            !(
              record.studentId === studentId &&
              record.subjectId === selectedSubjectId &&
              record.gradingPeriod === gradingPeriod
            )
        );
        next.unshift(data);
        return next;
      });
      setMessage("Grade saved successfully.");
    } catch (error) {
      setMessage("Failed to save grade");
    } finally {
      setSavingStudentId("");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600">
        Loading gradebook...
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "TEACHER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-700 bg-slate-900/70 p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Teacher Gradebook</p>
            <h1 className="mt-2 text-3xl font-semibold">Enter and manage grades</h1>
            <p className="mt-2 text-sm text-slate-400">Quarter-based grading for {session?.user?.name || "teacher"}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/teacher")}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login/teacher" })}
              className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Academic Year</p>
            <p className="mt-2 text-2xl font-semibold">{academicYear || "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sections</p>
            <p className="mt-2 text-2xl font-semibold">{sections.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Grade Records</p>
            <p className="mt-2 text-2xl font-semibold">{gradeRecords.length}</p>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-200">
            {message}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/70 p-6 shadow-2xl">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Section</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              >
                <option value="">Select section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              >
                <option value="">Select subject</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Grading Period</label>
              <select
                value={gradingPeriod}
                onChange={(e) => setGradingPeriod(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
              >
                <option>Quarter 1</option>
                <option>Quarter 2</option>
                <option>Quarter 3</option>
                <option>Quarter 4</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/70 p-6 shadow-2xl overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Student Grades</h2>
              <p className="text-sm text-slate-400">
                {selectedSection?.name || "Select a section"} · {gradingPeriod}
              </p>
            </div>
            <p className="text-sm text-slate-400">{selectedStudents.length} students</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                  <th className="py-3 pr-4">Student</th>
                  <th className="py-3 pr-4">Student ID</th>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3 pr-4">Remarks</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No students found in this section.
                    </td>
                  </tr>
                ) : (
                  selectedStudents.map((student) => (
                    <tr key={student.id} className="border-b border-slate-800">
                      <td className="py-4 pr-4">
                        <div>
                          <p className="font-medium text-white">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.email}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-sm text-slate-300">{student.studentId}</td>
                      <td className="py-4 pr-4">
                        <input
                          type="number"
                          value={scoreDrafts[student.id] || ""}
                          onChange={(e) => setScoreDrafts((current) => ({ ...current, [student.id]: e.target.value }))}
                          className="w-28 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                          placeholder="0"
                          min={0}
                          max={100}
                        />
                      </td>
                      <td className="py-4 pr-4">
                        <input
                          type="text"
                          value={remarksDrafts[student.id] || ""}
                          onChange={(e) => setRemarksDrafts((current) => ({ ...current, [student.id]: e.target.value }))}
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                          placeholder="Optional remarks"
                        />
                      </td>
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => saveGrade(student.id)}
                          disabled={savingStudentId === student.id || !selectedSubjectId}
                          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingStudentId === student.id ? "Saving..." : "Save"}
                        </button>
                      </td>
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
