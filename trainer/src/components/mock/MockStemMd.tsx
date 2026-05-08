'use client';

export function MockStemMd({ md }: { md: string }) {
  const parts = md.split(/\*\*/);
  return (
    <div className="whitespace-pre-wrap text-base leading-relaxed">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-[color:var(--ink)]">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </div>
  );
}
