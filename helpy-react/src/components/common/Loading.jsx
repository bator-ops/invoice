export function Loading({ colSpan }) {
  const inner = (
    <div className="loading"><i className="ti ti-loader-2" />Уншиж байна...</div>
  );
  if (colSpan) return <tr><td colSpan={colSpan}>{inner}</td></tr>;
  return inner;
}

export function EmptyState({ colSpan, icon = 'ti-inbox', message = 'Өгөгдөл олдсонгүй' }) {
  const inner = (
    <div className="empty"><i className={`ti ${icon}`} />{message}</div>
  );
  if (colSpan) return <tr><td colSpan={colSpan}>{inner}</td></tr>;
  return inner;
}

export function ErrorState({ colSpan, message }) {
  const inner = (
    <div className="empty" style={{ color: '#e53e3e' }}>
      <i className="ti ti-alert-circle" />{message}
    </div>
  );
  if (colSpan) return <tr><td colSpan={colSpan}>{inner}</td></tr>;
  return inner;
}
