export default function FieldFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-green-dark overflow-hidden">
      <div className="absolute inset-0 markthalle-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-bronze/40 pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-bronze/40 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-bronze/40 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-bronze/40 pointer-events-none" />
      <div className="relative z-10 px-4 py-10">{children}</div>
    </div>
  );
}
