import fs from "fs/promises";
import path from "path";

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    // simple CSV parse: split on commas, trim. Assumes no quoted commas.
    const cols = line.split(",").map((c) => c.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    return obj;
  });
  return rows;
}

export async function GET() {
  try {
    const base = path.resolve(process.cwd(), "data");
    const files = ["subjects.csv", "sections.csv", "sample_students.csv", "time_slots.csv"];
    const result: Record<string, any> = {};

    await Promise.all(
      files.map(async (file) => {
        try {
          const full = path.join(base, file);
          const txt = await fs.readFile(full, "utf8");
          result[file] = parseCSV(txt);
        } catch (e) {
          result[file] = { error: "not found or unreadable" };
        }
      })
    );

    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), records: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to read records" }), { status: 500 });
  }
}
