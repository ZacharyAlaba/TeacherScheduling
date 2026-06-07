const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export function isPeLikeSubject(subjectName: string): boolean {
  return (
    /(^|\b)(pe|hope|mapeh)(\b|$)/i.test(subjectName) ||
    /physical education|health optimization program for education/i.test(subjectName)
  );
}

export function getWeeklySubjectCap(subjectName: string): number {
  return isPeLikeSubject(subjectName) ? 1 : 4;
}

type ExistingSubjectSlot = {
  day: string;
};

export function validateSectionSubjectPlacement(
  subjectName: string,
  existingSlots: ExistingSubjectSlot[],
  incomingDay: string
): { valid: true } | { valid: false; error: string } {
  const weeklyCap = getWeeklySubjectCap(subjectName);

  if (existingSlots.length >= weeklyCap) {
    return {
      valid: false,
      error: `${subjectName} exceeds weekly cap (${weeklyCap} hour${weeklyCap === 1 ? "" : "s"})`,
    };
  }

  if (weeklyCap > 1 && WEEKDAYS.includes(incomingDay as (typeof WEEKDAYS)[number])) {
    const alreadyOnDay = existingSlots.some((slot) => slot.day === incomingDay);

    if (alreadyOnDay) {
      return {
        valid: false,
        error: `${subjectName} is already scheduled on ${incomingDay} for this section. Use another day to keep a flexible/vacant day pattern.`,
      };
    }
  }

  return { valid: true };
}

export { WEEKDAYS };
