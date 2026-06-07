"use client";

import React, { useState, useEffect } from "react";

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface ScheduleBlock {
  id: string;
  teacher: { user: { name: string } };
  subject: { name: string };
  section: { id: string; name: string; gradeLevel: string };
  timeSlot: TimeSlot;
  room: string | null;
}

interface Section {
  id: string;
  name: string;
  gradeLevel: string;
  track: string;
}

interface Teacher {
  id: string;
  user: { name: string };
}

interface Subject {
  id: string;
  name: string;
  gradeLevel: string;
}

export default function MasterScheduleTable() {
  const [schedules, setSchedules] = useState<ScheduleBlock[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("G11");
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ sectionId: string; timeSlotId: string } | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [schedulesRes, sectionsRes, timeSlotsRes, teachersRes, subjectsRes] = await Promise.all([
        fetch("/api/admin/schedules"),
        fetch("/api/admin/sections"),
        fetch("/api/admin/time-slots"),
        fetch("/api/admin/teachers"),
        fetch("/api/admin/subjects"),
      ]);

      if (schedulesRes.ok) setSchedules(await schedulesRes.json());
      if (sectionsRes.ok) setSections(await sectionsRes.json());
      if (timeSlotsRes.ok) setTimeSlots(await timeSlotsRes.json());
      if (teachersRes.ok) setTeachers(await teachersRes.json());
      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Get sections for selected grade
  const gradeSections = sections.filter(s => s.gradeLevel === selectedGrade);

  // Get unique days and sort them
  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const uniqueDays = daysOrder.filter(day => 
    timeSlots.some(ts => ts.day === day)
  );

  // Create unique row slots (time only) and sort once
  const rowTimeSlots = Array.from(
    new Map(timeSlots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot])).values()
  ).sort((a, b) => {
    const timeA = Number(a.startTime.replace(":", ""));
    const timeB = Number(b.startTime.replace(":", ""));
    return timeA - timeB;
  });

  // Get schedule for a specific slot and section
  function getScheduleForSlot(sectionId: string, timeSlotId: string): ScheduleBlock | undefined {
    return schedules.find(
      s => s.section.id === sectionId && s.timeSlot.id === timeSlotId
    );
  }

  function formatTime(time: string): string {
    const normalized = (time || "").trim();
    const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return normalized;

    const hour24 = Number(match[1]);
    const minutes = match[2];
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;

    return `${String(hour12).padStart(2, "0")}:${minutes} ${period}`;
  }

  function formatCompactTime(time: string): string {
    const normalized = (time || "").trim();
    const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return normalized;

    const hour24 = Number(match[1]);
    const minutes = match[2];
    const hour12 = hour24 % 12 || 12;

    return `${hour12}:${minutes}`;
  }

  function openAssignModal(sectionId: string, timeSlotId: string) {
    const existingSchedule = getScheduleForSlot(sectionId, timeSlotId);
    if (existingSchedule) {
      setError("This slot is already assigned. Delete first to reassign.");
      return;
    }
    setSelectedSlot({ sectionId, timeSlotId });
    setShowModal(true);
    setError("");
    setSuccess("");
    setSelectedTeacher("");
    setSelectedSubject("");
  }

  async function handleAssign() {
    if (!selectedSlot || !selectedTeacher || !selectedSubject) {
      setError("Please select teacher and subject");
      return;
    }

    try {
      const response = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          subjectId: selectedSubject,
          sectionId: selectedSlot.sectionId,
          timeSlotId: selectedSlot.timeSlotId,
          room: null,
        }),
      });

      if (response.ok) {
        setSuccess("Class assigned successfully!");
        setShowModal(false);
        setSelectedSlot(null);
        setSelectedTeacher("");
        setSelectedSubject("");
        // Reload data
        loadData();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to assign class");
      }
    } catch (error) {
      setError("Error assigning class");
      console.error(error);
    }
  }

  async function handleDelete(scheduleId: string) {
    if (!confirm("Remove this assignment?")) return;

    try {
      const response = await fetch(`/api/admin/schedules?id=${scheduleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Assignment removed");
        loadData();
      } else {
        setError("Failed to remove assignment");
      }
    } catch (error) {
      setError("Error removing assignment");
      console.error(error);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-400">Loading...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl">
      {/* Grade Selector */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-semibold text-slate-300">Grade Level:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedGrade("G11")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedGrade === "G11"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Grade 11
          </button>
          <button
            onClick={() => setSelectedGrade("G12")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedGrade === "G12"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Grade 12
          </button>
        </div>
        <span className="text-sm text-slate-500">
          ({gradeSections.length} sections)
        </span>
      </div>

      {/* Master Schedule Table */}
      <div className="mb-2 text-xs text-slate-400">Tip: Scroll horizontally to view all sections.</div>
      <div className="overflow-x-auto border border-slate-700 rounded-lg">
        <table className="min-w-max border-collapse bg-slate-800">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700">
              {/* Time column */}
              <th className="border border-slate-700 px-4 py-3 text-left text-sm font-bold text-slate-300 w-44 bg-slate-950 sticky left-0 z-20">
                TIME
              </th>

              {/* Section columns */}
              {gradeSections.map((section, sectionIndex) => (
                <th
                  key={section.id}
                  colSpan={5}
                  className={`border border-slate-700 px-3 py-3 text-center text-sm font-bold text-white bg-slate-800 ${
                    sectionIndex > 0 ? "border-l-4 border-l-indigo-500/70" : ""
                  }`}
                >
                  <div className="font-semibold">{section.name}</div>
                  <div className="text-xs text-slate-400">{section.track}</div>
                </th>
              ))}
            </tr>

            {/* Days row */}
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="border border-slate-700 px-3 py-2 bg-slate-950"></th>
              {gradeSections.map((section, sectionIndex) => (
                <React.Fragment key={`days-${section.id}`}>
                  {uniqueDays.map((day, dayIndex) => (
                    <th
                      key={`${section.id}-${day}`}
                      className={`border border-slate-700 px-2 py-2 text-center text-xs font-semibold text-slate-300 min-w-[84px] ${
                        sectionIndex > 0 && dayIndex === 0 ? "border-l-4 border-l-indigo-500/70" : ""
                      }`}
                    >
                      {day.substring(0, 3).toUpperCase()}
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {rowTimeSlots.map((timeSlot, rowIndex) => (
              <tr key={timeSlot.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                {/* Time cell */}
                <td className={`border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 bg-slate-950 sticky left-0 z-10 whitespace-nowrap ${
                  rowIndex % 2 === 0 ? "bg-slate-950" : "bg-slate-900"
                }`}>
                  <div className="text-sm leading-none">
                    {formatCompactTime(timeSlot.startTime)}-{formatCompactTime(timeSlot.endTime)}
                  </div>
                </td>

                {/* Schedule cells */}
                {gradeSections.map((section, sectionIndex) => (
                  <React.Fragment key={`cells-${section.id}`}>
                    {uniqueDays.map((day, dayIndex) => {
                      // Find slot for this day
                      const slot = timeSlots.find(
                        ts => ts.day === day && ts.startTime === timeSlot.startTime
                      );
                      const schedule = slot ? getScheduleForSlot(section.id, slot.id) : null;

                      return (
                        <td
                          key={`${section.id}-${day}-${timeSlot.id}`}
                          onClick={() => slot && !schedule && openAssignModal(section.id, slot.id)}
                          className={`border border-slate-700 px-2 py-2 text-xs align-top h-28 min-w-[84px] ${
                            sectionIndex > 0 && dayIndex === 0 ? "border-l-4 border-l-indigo-500/70" : ""
                          } ${
                            schedule 
                              ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 cursor-default" 
                              : rowIndex % 2 === 0
                              ? "bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                              : "bg-slate-800/70 hover:bg-slate-700/60 cursor-pointer"
                          }`}
                        >
                          {schedule ? (
                            <div className="rounded bg-gradient-to-br from-indigo-500/40 to-purple-500/40 border border-indigo-400/50 p-2 h-full overflow-hidden flex flex-col justify-between">
                              <div>
                                <div className="font-bold text-indigo-200 text-xs leading-tight">
                                  {schedule.teacher.user.name}
                                </div>
                                <div className="text-slate-300 text-[11px] leading-tight mt-1">
                                  {schedule.subject.name}
                                </div>
                                {schedule.room && (
                                  <div className="text-slate-400 text-[10px] mt-1">
                                    Room: {schedule.room}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(schedule.id);
                                }}
                                className="text-[10px] px-2 py-1 bg-red-500/30 hover:bg-red-500/50 text-red-200 border border-red-400/30 rounded transition mt-2"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-600 group">
                              <span className="opacity-0 group-hover:opacity-100 text-lg">+</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {gradeSections.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No sections found for {selectedGrade}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-green-300 text-sm">
          {success}
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 border border-slate-700 shadow-2xl">
            <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Assign Class</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSlot(null);
                  setError("");
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Teacher</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select subject...</option>
                  {subjects
                    .filter((s) => s.gradeLevel === selectedGrade)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedSlot(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
