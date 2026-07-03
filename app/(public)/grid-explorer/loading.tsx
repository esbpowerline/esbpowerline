export default function PowerGridLoading() {
  return (
    <div className="container py-8">
      <div className="mb-8 space-y-3">
        <div className="h-3 w-40 rounded bg-muted/60 animate-pulse" />
        <div className="h-9 w-full max-w-xl rounded bg-muted/50 animate-pulse" />
        <div className="h-4 w-full max-w-lg rounded bg-muted/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl border border-border/50 bg-muted/20 animate-pulse" />
        ))}
      </div>
      <div className="h-[28rem] rounded-2xl border border-border/50 bg-muted/15 animate-pulse" />
    </div>
  );
}