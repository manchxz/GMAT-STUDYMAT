export function HomeBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05]"
      aria-hidden
      style={{
        backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
      }}
    />
  );
}
