#!/usr/bin/env node
// Parse each chapter HTML in public/textbook/chapters/ into TutorChapterChunk
// rows for the tutor's keyword retrieval pipeline. Runs in the trainer's
// `prebuild` after sync-textbook.mjs has copied the chapters into public/.
//
// Strategy: regex-based parse (no DOM lib required). For each chapter, walk
// from the first <h2> onward; treat each <h2>/<h3> as the start of a chunk and
// take everything until the next heading at the same-or-higher level. Strip
// HTML tags for the `text` field; keep the heading + anchor for citations.
//
// Failure-tolerant: if DATABASE_URL is unset (e.g. on Vercel preview without
// a DB), we log and exit 0 so the build can continue.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const chaptersDir = join(projectRoot, 'public', 'textbook', 'chapters');

const CHAPTER_TITLES = {
  '01-quant-number-properties': 'Number Properties',
  '02-quant-algebraic-logic': 'Algebraic Logic',
  '03-quant-word-problems': 'Word Problem Deconstruction',
  '04-verbal-critical-reasoning': 'Critical Reasoning',
  '05-verbal-reading-comp': 'Reading Comprehension Archetypes',
  '06-di-data-sufficiency': 'Data Sufficiency 2.0',
  '07-di-multi-source-reasoning': 'Multi-Source Reasoning',
  '08-di-table-analysis': 'Table Analysis',
  '09-di-graphics-interpretation': 'Graphics Interpretation',
  '10-strategy-art-of-skip': 'Art of the Skip',
  'appendix-trap-library': 'Trap Library Appendix',
};

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseChapter(html) {
  const headingRe = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const matches = [];
  let m;
  while ((m = headingRe.exec(html))) {
    const level = Number(m[1]);
    const attrs = m[2] || '';
    const inner = stripHtml(m[3]);
    if (!inner) continue;
    const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
    const anchor = idMatch ? idMatch[1] : slugify(inner);
    matches.push({
      level,
      heading: inner,
      anchor,
      start: m.index,
      end: m.index + m[0].length,
    });
  }

  const chunks = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    let endIndex = html.length;
    for (let j = i + 1; j < matches.length; j++) {
      if (matches[j].level <= cur.level) {
        endIndex = matches[j].start;
        break;
      }
    }
    const body = html.slice(cur.end, endIndex);
    const text = stripHtml(body);
    if (text.length < 20) continue;
    chunks.push({
      level: cur.level,
      heading: cur.heading,
      anchor: cur.anchor,
      text,
    });
  }
  return chunks;
}

async function main() {
  if (!existsSync(chaptersDir)) {
    console.warn(
      `[index-chapters] ${chaptersDir} does not exist. Run sync-textbook first.`,
    );
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.warn(
      '[index-chapters] DATABASE_URL not set. Skipping DB indexing (build will continue).',
    );
    return;
  }

  let prisma;
  try {
    const mod = await import('@prisma/client');
    prisma = new mod.PrismaClient();
  } catch (err) {
    console.warn(
      '[index-chapters] could not load @prisma/client. Run `prisma generate` first. Skipping.',
      err.message,
    );
    return;
  }

  try {
    await prisma.tutorChapterChunk.deleteMany({});
  } catch (err) {
    console.warn(
      '[index-chapters] could not clear TutorChapterChunk (ok if first run, table missing):',
      err.message,
    );
    await prisma.$disconnect();
    return;
  }

  const files = readdirSync(chaptersDir)
    .filter((f) => f.endsWith('.html'))
    .sort();

  let total = 0;
  for (const file of files) {
    const slug = basename(file, '.html');
    const title = CHAPTER_TITLES[slug] || slug;
    const html = readFileSync(join(chaptersDir, file), 'utf8');
    const chunks = parseChapter(html);

    let ordinal = 0;
    for (const c of chunks) {
      ordinal += 1;
      try {
        await prisma.tutorChapterChunk.upsert({
          where: {
            chapterSlug_anchor: { chapterSlug: slug, anchor: c.anchor },
          },
          update: {
            chapterTitle: title,
            heading: c.heading,
            level: c.level,
            ordinal,
            text: c.text,
          },
          create: {
            chapterSlug: slug,
            chapterTitle: title,
            heading: c.heading,
            anchor: c.anchor,
            level: c.level,
            ordinal,
            text: c.text,
          },
        });
        total += 1;
      } catch (err) {
        console.warn(
          `[index-chapters] skip ${slug}#${c.anchor}:`,
          err.message,
        );
      }
    }
    console.log(`[index-chapters] ${slug}: ${chunks.length} chunks`);
  }

  console.log(`[index-chapters] indexed ${total} total chunks`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
