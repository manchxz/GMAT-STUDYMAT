'use client';

import { forwardRef } from 'react';

export const TUTOR_CHAPTERS = [
  { slug: '01-quant-number-properties', label: '1 · Number Properties' },
  { slug: '02-quant-algebraic-logic', label: '2 · Algebraic Logic' },
  { slug: '03-quant-word-problems', label: '3 · Word Problems' },
  { slug: '04-verbal-critical-reasoning', label: '4 · Critical Reasoning' },
  { slug: '05-verbal-reading-comp', label: '5 · Reading Comp' },
  { slug: '06-di-data-sufficiency', label: '6 · Data Sufficiency 2.0' },
  { slug: '07-di-multi-source-reasoning', label: '7 · Multi-Source' },
  { slug: '08-di-table-analysis', label: '8 · Table Analysis' },
  { slug: '09-di-graphics-interpretation', label: '9 · Graphics' },
  { slug: '10-strategy-art-of-skip', label: '10 · Art of the Skip' },
  { slug: 'appendix-trap-library', label: 'Appendix · Trap Library' },
] as const;

interface Props {
  chapterSlug: string;
  anchor?: string | null;
}

const ChapterFrame = forwardRef<HTMLIFrameElement, Props>(function ChapterFrame(
  { chapterSlug, anchor },
  ref,
) {
  const src =
    `/textbook/chapters/${chapterSlug}.html` + (anchor ? `#${anchor}` : '');
  return (
    <iframe
      ref={ref}
      src={src}
      title={`Chapter ${chapterSlug}`}
      className="h-full w-full border-0 bg-white"
    />
  );
});

export default ChapterFrame;
