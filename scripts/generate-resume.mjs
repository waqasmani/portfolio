/**
 * Generates public/resume.pdf — a clean single-page resume — with zero
 * dependencies (hand-assembled PDF using the built-in Helvetica fonts).
 *
 *   node scripts/generate-resume.mjs
 *
 * Content mirrors src/config/site.ts; regenerate after rebranding.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'resume.pdf');

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = '0.10 0.12 0.18';
const MUTED = '0.36 0.40 0.50';
const ACCENT = '0.33 0.38 0.85';
const LINE = '0.85 0.86 0.90';

const ops = [];
let y = PAGE_H - MARGIN;

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function text(str, { x = MARGIN, size = 9.5, bold = false, color = INK, dy = 0 } = {}) {
  ops.push(`BT ${color} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y + dy} Td (${esc(str)}) Tj ET`);
}

function rightText(str, { size = 9, bold = false, color = MUTED } = {}) {
  // Approximate right alignment for Helvetica (~0.5 * size average glyph width).
  const width = str.length * size * 0.5;
  text(str, { x: PAGE_W - MARGIN - width, size, bold, color });
}

function rule(color = LINE, width = 0.7) {
  ops.push(`${color} RG ${width} w ${MARGIN} ${y} m ${PAGE_W - MARGIN} ${y} l S`);
}

function wrap(str, maxChars) {
  const words = str.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function paragraph(str, { size = 9.5, leading = 13.5, color = INK, maxChars = 102, x = MARGIN } = {}) {
  for (const line of wrap(str, maxChars)) {
    text(line, { x, size, color });
    y -= leading;
  }
}

function sectionLabel(label) {
  y -= 8;
  text(label.toUpperCase(), { size: 8.5, bold: true, color: ACCENT });
  y -= 6;
  rule();
  y -= 15;
}

// ---------------------------------------------------------------- header
text('WAQAS MANI', { size: 25, bold: true });
y -= 18;
text('Full Stack Web Developer', { size: 11.5, color: ACCENT, bold: true });
y -= 16;
text('hello@waqasmani.dev   ·   github.com/waqasmani   ·   linkedin.com/in/waqasmani   ·   Remote / Worldwide (UTC+5)', {
  size: 8.8,
  color: MUTED,
});
y -= 14;

// ---------------------------------------------------------------- summary
sectionLabel('Summary');
paragraph(
  'Full stack engineer with 8+ years designing, building, and operating production web platforms - multi-tenant SaaS, e-commerce with custom checkouts, purpose-built CRMs, and high-throughput APIs. I own outcomes end to end: honest scoping, clean architecture, measured results, and infrastructure that stays boring after launch.'
);

// ---------------------------------------------------------------- skills
sectionLabel('Core Skills');
const skills = [
  ['Frontend', 'Next.js, React, TypeScript, JavaScript, Tailwind CSS, Vue.js'],
  ['Backend', 'Node.js, Express, Fastify, REST APIs, Authentication, WebSockets / SSE'],
  ['Databases', 'PostgreSQL, MariaDB, MySQL, Prisma, Redis - schema design & query tuning'],
  ['Cloud & DevOps', 'Linux, Ubuntu, Docker, Nginx, Cloudflare (+R2), GitHub Actions, PM2'],
];
for (const [label, value] of skills) {
  text(label, { size: 9.5, bold: true });
  text(value, { x: MARGIN + 110, size: 9.5, color: MUTED });
  y -= 14.5;
}

// ---------------------------------------------------------------- experience
sectionLabel('Experience');
const roles = [
  {
    role: 'Independent Full Stack Developer',
    org: 'Freelance & consulting',
    period: '2021 - Present',
    bullets: [
      'Design, build, and operate client platforms end to end: a multi-tenant operations SaaS across 7 warehouses (92% less stock drift), a headless storefront (+34% checkout conversion, 1.4s LCP), and a freight CRM cutting quote turnaround from 2 days to 2 minutes.',
      'Rebuilt an analytics ingestion pipeline to sustain 38M events/day on two VPS nodes at 78% lower cost; maintain an open-source zero-downtime deployment CLI used by 1.9k+ developers.',
    ],
  },
  {
    role: 'Lead Web Developer',
    org: 'Digital product agency',
    period: '2018 - 2021',
    bullets: [
      'Led a four-person team across a dozen concurrent client builds; owned architecture, code review culture, and the CI/CD pipeline that took deployments from monthly to daily.',
    ],
  },
  {
    role: 'Full Stack Developer',
    org: 'E-commerce scale-up',
    period: '2016 - 2018',
    bullets: [
      'Shipped checkout, inventory, and fulfilment features on a high-traffic storefront where downtime had a price per minute.',
    ],
  },
];
for (const entry of roles) {
  text(entry.role, { size: 10.5, bold: true });
  rightText(entry.period, { size: 9, color: MUTED });
  y -= 13;
  text(entry.org, { size: 9, color: ACCENT });
  y -= 14;
  for (const bullet of entry.bullets) {
    text('-', { x: MARGIN + 2, size: 9.5, color: MUTED });
    const lines = wrap(bullet, 96);
    for (const line of lines) {
      text(line, { x: MARGIN + 14, size: 9.5, color: INK });
      y -= 13;
    }
    y -= 1;
  }
  y -= 6;
}

// ---------------------------------------------------------------- approach
sectionLabel('How I Work');
paragraph(
  'Scope honestly (surprises belong in week one), ship iteratively (working software on a staging URL every week), measure everything (performance budgets and conversion events, not vibes), and document as I go (the next engineer should sleep well). Clients own their code, repos, and infrastructure from the first commit.'
);

y -= 4;
rule();
y -= 14;
text('Full case studies with architecture decisions and measured results: see the Projects section of my portfolio.', {
  size: 8.8,
  color: MUTED,
});

// ---------------------------------------------------------------- assemble PDF
const content = ops.join('\n');
const objects = [];
objects.push('<< /Type /Catalog /Pages 2 0 R >>');
objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
objects.push(
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`
);
objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);

let pdf = '%PDF-1.4\n';
const offsets = [0];
for (let i = 0; i < objects.length; i++) {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}
const xrefStart = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(pdf, 'latin1'));
console.log(`Wrote ${out} (${Buffer.byteLength(pdf, 'latin1')} bytes, final y=${Math.round(y)})`);
