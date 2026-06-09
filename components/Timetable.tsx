"use client";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface ScheduleItem {
  day: string;
  timeSlot: string;
  subject: string;
  section: string;
  room?: string | null;
}

interface TimetableProps {
  schedule: ScheduleItem[];
  timeSlots: TimeSlot[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Timetable({ schedule, timeSlots }: TimetableProps) {
  const uniqueTimeSlots = Array.from(
    new Map(timeSlots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot])).values()
  );

  const getScheduleItem = (day: string, timeSlot: string) => {
    return schedule.find(
      (item) => item.day === day && item.timeSlot === timeSlot
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-lg shadow-slate-950/40">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 border border-slate-700 bg-slate-900 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-100"
                >
                  Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    className="min-w-[180px] border border-slate-700 bg-slate-900 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-100"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueTimeSlots.map((slot, index) => {
                const timeSlotKey = `${slot.startTime}-${slot.endTime}`;
                return (
                  <tr
                    key={timeSlotKey}
                    className={index % 2 === 0 ? "bg-slate-950" : "bg-slate-900"}
                  >
                    <td className="sticky left-0 z-10 w-[130px] whitespace-nowrap border border-slate-700 bg-slate-900 px-3 py-3 text-xs font-semibold text-slate-200">
                      <div className="flex flex-col">
                        <span>{slot.startTime}</span>
                        <span className="text-[10px] font-medium text-slate-500">to</span>
                        <span>{slot.endTime}</span>
                      </div>
                    </td>

                    {DAYS.map((day) => {
                      const item = getScheduleItem(day, timeSlotKey);
                      return (
                        <td
                          key={`${day}-${timeSlotKey}`}
                          className="min-h-[88px] min-w-[180px] border border-slate-700 px-2 py-2 align-top"
                        >
                          {item ? (
                            <div className="h-full rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-sm shadow-slate-950/20">
                              <div className="mb-1 text-sm font-semibold leading-tight text-slate-100">
                                {item.subject}
                              </div>
                              <div className="text-xs font-medium text-slate-300">
                                {item.section}
                              </div>
                              {item.room && (
                                <div className="mt-2 inline-block rounded bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
                                  Room {item.room}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex min-h-[72px] items-center justify-center text-xs text-slate-500">
                              Free
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
