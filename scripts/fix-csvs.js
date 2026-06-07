const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, '..', '..', 'data');

function fixFile(file) {
  const full = path.join(dataDir, file);
  const txt = fs.readFileSync(full, 'utf8');
  const lines = txt.split(/\r?\n/);
  if (lines.length === 0) return;
  const header = lines[0];
  const expected = header.split(',').length;
  const out = [header];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    // Quick heuristic: if row has more columns than header, merge extras into last field
    const cols = line.split(',');
    if (cols.length <= expected) {
      out.push(line);
    } else {
      const first = cols.slice(0, expected - 1).map(s => s.trim());
      const rest = cols.slice(expected - 1).join(',').trim();
      // Quote the last field and escape internal quotes
      const fixedLast = rest.includes(',') || rest.includes('"') ? '"' + rest.replace(/"/g, '""') + '"' : rest;
      out.push(first.concat([fixedLast]).join(','));
    }
  }

  // backup
  fs.copyFileSync(full, full + '.bak');
  fs.writeFileSync(full, out.join('\n'), 'utf8');
  console.log(`Fixed ${file} (expected cols=${expected}). Backup at ${file}.bak`);
}

try {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
  files.forEach(fixFile);
  console.log('CSV fix complete');
} catch (e) {
  console.error('Failed to fix CSVs', e);
  process.exit(1);
}
