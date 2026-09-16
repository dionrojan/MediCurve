// Skeleton loading placeholder components

export function SkeletonCard({ height = 120 }: { height?: number }) {
  return <div className="skeleton" style={{ height }} />;
}

export function SkeletonText({ width = '100%' }: { width?: string | number }) {
  return <div className="skeleton" style={{ height: 16, width, borderRadius: 6 }} />;
}

export function SkeletonDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <SkeletonCard height={80} />
      <SkeletonCard height={140} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 16 }}>
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
        <SkeletonCard height={160} />
      </div>
      <SkeletonCard height={220} />
    </div>
  );
}
