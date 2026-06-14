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
  teacher: { id: string; user: { name: string } };
  subject: { id: string; name: string };
  section: { id: string; name: string; gradeLevel: string };
  timeSlot: TimeSlot;
  room: string | null;
}

interface MasterScheduleTableProps {
  onSchedulesUpdate?: (schedules: ScheduleBlock[]) => void;
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
  qualifications?: { subjectId: string }[];
}

interface Subject {
  id: string;
  name: string;
  gradeLevel: string;
  track?: string | null;
}

export default function MasterScheduleTable({ onSchedulesUpdate }: MasterScheduleTableProps) {
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
  const [prefillLabel, setPrefillLabel] = useState("");
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

      if (schedulesRes.ok) {
        const loadedSchedules = await schedulesRes.json();
        setSchedules(loadedSchedules);
        onSchedulesUpdate?.(loadedSchedules);
      }
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

  const allowedExtraSections = new Set(["PHYTAGORAS", "PDL"]);
  const fridayExtraSlot: TimeSlot = {
    id: "generated-friday-17-18",
    day: "Friday",
    startTime: "17:00",
    endTime: "18:00",
  };

  function normalizeSectionKey(section: { name: string; gradeLevel: string; track: string }) {
    const name = (section.name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const grade = (section.gradeLevel || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const track = (section.track || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return `${grade}:${track}:${name}`;
  }

  // Get sections for selected grade
  const gradeSections = Array.from(
    new Map(
      sections
        .filter((s) => s.gradeLevel === selectedGrade)
        .map((section) => [normalizeSectionKey(section), section])
    ).values()
  );

  // Add Friday 5:00-6:00 only when PHYTAGORAS or PDL are present in Grade 11
  const effectiveTimeSlots = [...timeSlots];
  if (
    selectedGrade === "G11" &&
    gradeSections.some((section) => allowedExtraSections.has(normalizeSectionKey(section))) &&
    !effectiveTimeSlots.some((slot) => slot.day === "Friday" && slot.startTime === "17:00")
  ) {
    effectiveTimeSlots.push(fridayExtraSlot);
  }

  // Get unique days and sort them
  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const uniqueDays = daysOrder.filter(day => 
    effectiveTimeSlots.some(ts => ts.day === day)
  );

  // Create unique row slots (time only) and sort once
  const rowTimeSlots = Array.from(
    new Map(effectiveTimeSlots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot])).values()
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

  // Prefill mapping from pasted image for specific sections (visual-only overlay)
  const imagePrefill: Record<
    string,
    { day: string; startTime: string; label: string; bg?: string; textColor?: string; disableClick?: boolean }[]
  > = {
    // normalized section name -> entries
    PHYTAGORAS: [
      { day: "Friday", startTime: "07:45", label: "STAT", bg: "bg-pink-400", textColor: "text-white" },
      { day: "Friday", startTime: "08:45", label: "READING & WRTING", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Friday", startTime: "10:00", label: "BNC", bg: "bg-teal-700", textColor: "text-white" },
      { day: "Friday", startTime: "11:00", label: "BNC", bg: "bg-teal-700", textColor: "text-white" },
      { day: "Friday", startTime: "13:00", label: "UCSP", bg: "bg-amber-700", textColor: "text-white" },
      { day: "Friday", startTime: "14:00", label: "PhySci", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Friday", startTime: "15:00", label: "PAGBASA", bg: "bg-emerald-800", textColor: "text-white" },
      { day: "Friday", startTime: "16:00", label: "HOPE F", bg: "bg-violet-700", textColor: "text-white" },
      { day: "Friday", startTime: "17:00", label: "PR1", bg: "bg-red-600", textColor: "text-white" },
    ],
    PDL: [
      { day: "Friday", startTime: "07:45", label: "UCSP", bg: "bg-amber-700", textColor: "text-white" },
      { day: "Friday", startTime: "08:45", label: "PR", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Friday", startTime: "10:00", label: "PAGBASA", bg: "bg-emerald-800", textColor: "text-white" },
      { day: "Friday", startTime: "11:00", label: "READING & WRITING", bg: "bg-slate-200", textColor: "text-black" },
      { day: "Friday", startTime: "13:00", label: "STAT", bg: "bg-pink-400", textColor: "text-white" },
      { day: "Friday", startTime: "14:00", label: "HOUSEKEEPING", bg: "bg-cyan-400", textColor: "text-black" },
      { day: "Friday", startTime: "15:00", label: "HOUSEKEEPING", bg: "bg-cyan-400", textColor: "text-black" },
      { day: "Friday", startTime: "16:00", label: "PhySci", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Friday", startTime: "17:00", label: "HOPE F", bg: "bg-violet-700", textColor: "text-white" },
    ],
    DESCARTES: [
      { day: "Monday", startTime: "07:45", label: "UCSP", bg: "bg-slate-500", textColor: "text-white" },
      { day: "Tuesday", startTime: "07:45", label: "UCSP", bg: "bg-slate-500", textColor: "text-white" },
      { day: "Wednesday", startTime: "07:45", label: "UCSP", bg: "bg-slate-500", textColor: "text-white" },
      { day: "Thursday", startTime: "07:45", label: "UCSP", bg: "bg-slate-500", textColor: "text-white" },
      { day: "Friday", startTime: "07:45", label: "HRGP", bg: "bg-slate-500", textColor: "text-white" },
      { day: "Monday", startTime: "08:45", label: "READING & WRITING", bg: "bg-blue-600", textColor: "text-white" },
      { day: "Tuesday", startTime: "08:45", label: "READING & WRITING", bg: "bg-blue-600", textColor: "text-white" },
      { day: "Wednesday", startTime: "08:45", label: "READING & WRITING", bg: "bg-blue-600", textColor: "text-white" },
      { day: "Thursday", startTime: "08:45", label: "READING & WRITING", bg: "bg-blue-600", textColor: "text-white" },
      { day: "Friday", startTime: "08:45", label: "PR1", bg: "bg-red-600", textColor: "text-white" },
      { day: "Monday", startTime: "10:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Tuesday", startTime: "10:00", label: "HOPE F", bg: "bg-violet-700", textColor: "text-white" },
      { day: "Wednesday", startTime: "10:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Thursday", startTime: "10:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Friday", startTime: "10:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Monday", startTime: "11:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Tuesday", startTime: "11:00", label: "PAGBASA", bg: "bg-emerald-800", textColor: "text-white" },
      { day: "Wednesday", startTime: "11:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Thursday", startTime: "11:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Friday", startTime: "11:00", label: "EIM", bg: "bg-pink-500", textColor: "text-white" },
      { day: "Monday", startTime: "13:00", label: "PhySci", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Tuesday", startTime: "13:00", label: "PhySci", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Wednesday", startTime: "13:00", label: "PhySci", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Thursday", startTime: "13:00", label: "STAT", bg: "bg-pink-300", textColor: "text-black" },
      { day: "Friday", startTime: "13:00", label: "PhySci", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Monday", startTime: "14:00", label: "PAGBASA", bg: "bg-emerald-800", textColor: "text-white" },
      { day: "Tuesday", startTime: "14:00", label: "STAT", bg: "bg-pink-300", textColor: "text-black" },
      { day: "Wednesday", startTime: "14:00", label: "PR1", bg: "bg-red-600", textColor: "text-white" },
      { day: "Thursday", startTime: "14:00", label: "PR1", bg: "bg-red-600", textColor: "text-white" },
      { day: "Friday", startTime: "14:00", label: "STAT", bg: "bg-pink-300", textColor: "text-black" },
      { day: "Monday", startTime: "15:00", label: "PAGBASA", bg: "bg-emerald-800", textColor: "text-white" },
      { day: "Tuesday", startTime: "15:00", label: "STAT", bg: "bg-pink-300", textColor: "text-black" },
      { day: "Wednesday", startTime: "15:00", label: "PAGBASA", bg: "bg-emerald-800", textColor: "text-white" },
      { day: "Thursday", startTime: "15:00", label: "PR1", bg: "bg-red-600", textColor: "text-white" },
      { day: "Friday", startTime: "15:00", label: "HOPE F", bg: "bg-violet-700", textColor: "text-white" },
    ],
    KANT: [
      { day: "Monday", startTime: "07:45", label: "PAGBASA", bg: "bg-amber-900", textColor: "text-white" },
      { day: "Tuesday", startTime: "07:45", label: "PAGBASA", bg: "bg-amber-900", textColor: "text-white" },
      { day: "Wednesday", startTime: "07:45", label: "PAGBASA", bg: "bg-amber-900", textColor: "text-white" },
      { day: "Thursday", startTime: "07:45", label: "PAGBASA", bg: "bg-amber-900", textColor: "text-white" },
      { day: "Friday", startTime: "07:45", label: "HRGP", bg: "bg-slate-500", textColor: "text-white" },
      { day: "Monday", startTime: "08:45", label: "PR", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Tuesday", startTime: "08:45", label: "PR", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Wednesday", startTime: "08:45", label: "PR", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Thursday", startTime: "08:45", label: "PR", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Friday", startTime: "08:45", label: "PHYSCI", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Monday", startTime: "10:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Tuesday", startTime: "10:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Wednesday", startTime: "10:00", label: "HOPE F", bg: "bg-violet-700", textColor: "text-white" },
      { day: "Thursday", startTime: "10:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Friday", startTime: "10:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Monday", startTime: "11:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Tuesday", startTime: "11:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Wednesday", startTime: "11:00", label: "PHYSCI", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Thursday", startTime: "11:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Friday", startTime: "11:00", label: "BNC", bg: "bg-rose-100", textColor: "text-black" },
      { day: "Monday", startTime: "13:00", label: "STAT", bg: "bg-amber-300", textColor: "text-black" },
      { day: "Tuesday", startTime: "13:00", label: "STAT", bg: "bg-amber-300", textColor: "text-black" },
      { day: "Wednesday", startTime: "13:00", label: "STAT", bg: "bg-amber-300", textColor: "text-black" },
      { day: "Thursday", startTime: "13:00", label: "PHYSCI", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Friday", startTime: "13:00", label: "STAT", bg: "bg-amber-300", textColor: "text-black" },
      { day: "Monday", startTime: "14:00", label: "UCSP", bg: "bg-amber-700", textColor: "text-white" },
      { day: "Tuesday", startTime: "14:00", label: "UCSP", bg: "bg-amber-700", textColor: "text-white" },
      { day: "Wednesday", startTime: "14:00", label: "UCSP", bg: "bg-amber-700", textColor: "text-white" },
      { day: "Thursday", startTime: "14:00", label: "PHYSCI", bg: "bg-lime-400", textColor: "text-black" },
      { day: "Friday", startTime: "14:00", label: "UCSP", bg: "bg-amber-700", textColor: "text-white" },
      { day: "Monday", startTime: "15:00", label: "READING & WRITING", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Tuesday", startTime: "15:00", label: "READING & WRITING", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Wednesday", startTime: "15:00", label: "READING & WRITING", bg: "bg-rose-200", textColor: "text-black" },
      { day: "Thursday", startTime: "15:00", label: "READING & WRITING", bg: "bg-rose-200", textColor: "text-black" },
    ],
  };

  function getImagePrefill(sectionName: string, day: string, startTime: string) {
    const fixedBreaks: Record<string, { label: string; bg: string; textColor: string; disableClick: boolean }> = {
      "09:45": { label: "RECESS", bg: "bg-rose-300", textColor: "text-black", disableClick: true },
      "12:00": { label: "LUNCH BREAK", bg: "bg-rose-300", textColor: "text-black", disableClick: true },
    };

    if (fixedBreaks[startTime]) {
      return { day, startTime, ...fixedBreaks[startTime] };
    }

    const key = (sectionName || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const entries = imagePrefill[key];
    if (!entries) return null;
    return entries.find((e) => e.day === day && e.startTime === startTime) || null;
  }

  function normalizeSubjectLabel(label: string) {
    return (label || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function findSubjectIdForPrefill(label: string) {
    if (!label) return "";

    const normalizedLabel = normalizeSubjectLabel(label);
    const exactMatch = subjects.find(
      (subject) => normalizeSubjectLabel(subject.name) === normalizedLabel
    );
    if (exactMatch) return exactMatch.id;

    const aliasMap: Record<string, string> = {
      UCSP: "Understanding Culture, Society, and Politics",
      PR: "Practical Research 1",
      PR1: "Practical Research 1",
      READINGWRITING: "Reading and Writing Skills",
      READINGSWRITING: "Reading and Writing Skills",
      READINGANDWRITING: "Reading and Writing Skills",
      READING: "Reading and Writing Skills",
      STAT: "Statistics and Probability",
      PHYSCI: "Physical Science",
      EIM: "Electrical Installation and Maintenance",
      HOPF: "Health Optimization Program for Education 3",
      HOPEF: "Health Optimization Program for Education 3",
      HRGP: "Health Optimization Program for Education 3",
      BNC: "Beauty Nail and Culture",
      HOUSEKEEPING: "Housekeeping",
      PAGBASAAMORO: "Pagbasa at Pagsusuri ng Iba't Ibang Teksto Tungo sa Pananaliksik",
      PAGBASA: "Pagbasa at Pagsusuri ng Iba't Ibang Teksto Tungo sa Pananaliksik",
    };

    const alias = aliasMap[normalizedLabel];
    if (alias) {
      const aliasSubject = subjects.find(
        (subject) => normalizeSubjectLabel(subject.name) === normalizeSubjectLabel(alias)
      );
      if (aliasSubject) return aliasSubject.id;
    }

    // Fallback: search by keyword if it contains "reading" or other common keywords
    if (normalizedLabel.includes("READING")) {
      const readingSubject = subjects.find(
        (s) => normalizeSubjectLabel(s.name).includes("READING")
      );
      if (readingSubject) return readingSubject.id;
    }

    return "";
  }

  function isSlotAllowedForSection(sectionName: string, timeSlot: TimeSlot) {
    const normalized = (sectionName || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (timeSlot.startTime === "17:00") {
      return normalized === "PHYTAGORAS" || normalized === "PDL";
    }
    return true;
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

  function openAssignModal(sectionId: string, timeSlotId: string, subjectId?: string, label?: string) {
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
    setPrefillLabel(label || "");
    
    // Try to find subject ID
    let finalSubjectId = subjectId;
    if (!finalSubjectId && label) {
      // Retry with the label if subjectId wasn't found
      finalSubjectId = findSubjectIdForPrefill(label);
    }
    
    setSelectedSubject(finalSubjectId || "");
  }

  const selectedSection = selectedSlot
    ? sections.find((section) => section.id === selectedSlot.sectionId) || null
    : null;

  const availableSubjects = selectedSection
    ? subjects.filter((subject) => {
        const matchesGrade = subject.gradeLevel === selectedSection.gradeLevel;
        const track = subject.track?.trim();
        const sectionTrack = selectedSection.track?.trim();
        const matchesTrack = !track || track === sectionTrack;
        return matchesGrade && matchesTrack;
      })
    : subjects.filter((subject) => subject.gradeLevel === selectedGrade);

  const availableTeachers = teachers;

  async function handleAssign() {
    if (!selectedSlot || !selectedTeacher) {
      setError("Please select a teacher");
      return;
    }

    if (!selectedSubject) {
      setError("No subject assigned to this slot. Please select a slot with a subject.");
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
          overrideRules: true,
          overrideReason: "Admin schedule builder assignment",
        }),
      });

      if (response.ok) {
        setSuccess("Class assigned successfully!");
        setShowModal(false);
        setSelectedSlot(null);
        setSelectedTeacher("");
        setSelectedSubject("");
        setPrefillLabel("");
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

                      // compute available subjects for this section
                      const sectionSubjects = subjects.filter((s) => {
                        const matchesGrade = s.gradeLevel === section.gradeLevel;
                        const track = s.track?.trim();
                        const sectionTrack = section.track?.trim();
                        const matchesTrack = !track || track === sectionTrack;
                        return matchesGrade && matchesTrack;
                      });

                      const prefill = slot ? getImagePrefill(section.name, day, slot.startTime) : null;
                      const slotAllowed = slot && isSlotAllowedForSection(section.name, slot);
                      const isBreakSlot = prefill?.disableClick === true;

                      return (
                        <td
                          key={`${section.id}-${day}-${timeSlot.id}`}
                          className={`border border-slate-700 px-2 py-2 text-xs align-top h-28 min-w-[84px] ${
                            sectionIndex > 0 && dayIndex === 0 ? "border-l-4 border-l-indigo-500/70" : ""
                          } ${
                            schedule
                              ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 cursor-default"
                              : isBreakSlot
                              ? "bg-slate-800/30 cursor-default"
                              : rowIndex % 2 === 0
                              ? "bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                              : "bg-slate-800/70 hover:bg-slate-700/60 cursor-pointer"
                          }`}
                          onClick={() => slot && !schedule && slotAllowed && !isBreakSlot && openAssignModal(section.id, slot.id)}
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
                          ) : prefill ? (
                            prefill.disableClick ? (
                              <div
                                className={`w-full h-full rounded ${prefill.bg || "bg-slate-600"} ${prefill.textColor || "text-white"} p-2 flex items-center justify-center text-[12px] font-semibold text-center leading-tight cursor-default`}
                              >
                                {prefill.label}
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!slot) return;
                                  const prefillSubjectId = findSubjectIdForPrefill(prefill.label);
                                  openAssignModal(section.id, slot.id, prefillSubjectId, prefill.label);
                                }}
                                className={`w-full h-full rounded ${prefill.bg || "bg-slate-600"} ${prefill.textColor || "text-white"} p-2 flex items-center justify-center text-[12px] font-semibold text-center leading-tight`}
                              >
                                {prefill.label}
                              </button>
                            )
                          ) : slotAllowed ? (
                            // show a centered plus button for empty cells — click to open assign modal
                            <div className="h-full flex items-center justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!slot) return;
                                  openAssignModal(section.id, slot.id);
                                }}
                                aria-label="Add class"
                                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 text-xl"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">
                              Not available
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
                  setSelectedSubject("");
                  setSelectedTeacher("");
                  setPrefillLabel("");
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
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                <div className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm">
                  {selectedSubject ? (
                    subjects.find((s) => s.id === selectedSubject)?.name || "Unknown"
                  ) : prefillLabel ? (
                    <span className="text-slate-400">{prefillLabel} (lookup failed)</span>
                  ) : (
                    <span className="text-slate-400">No subject assigned to this slot</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Teacher</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select teacher...</option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedSlot(null);
                    setSelectedSubject("");
                    setSelectedTeacher("");
                    setPrefillLabel("");
                    setError("");
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
