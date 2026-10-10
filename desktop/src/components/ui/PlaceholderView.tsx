// ============================================================
// Placeholder view for unimplemented pages
// ============================================================
interface PlaceholderViewProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function PlaceholderView({ icon, title, description }: PlaceholderViewProps) {
  return (
    <div className="placeholder-view animate-fade-in">
      <div className="placeholder-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="status-badge none" style={{ marginTop: 8 }}>PLANNED</span>
    </div>
  );
}
