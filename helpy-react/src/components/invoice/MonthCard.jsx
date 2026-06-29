import { MN_MONTHS, fmt, fmtN, currentYM } from '../../utils/format';

export default function MonthCard({ row, onSelect }) {
  const isCurrent = row.ym === currentYM();
  const mn = parseInt(row.month, 10);

  return (
    <div className={`month-card ${isCurrent ? 'current' : ''}`}>
      <div className="mc-label">{row.year} — {MN_MONTHS[mn] || `${mn}-р сар`}</div>
      <div className="mc-sms">
        <i className="ti ti-message-2" style={{ fontSize: 16, color: '#8a9bc0' }} /> {fmtN(row.sms_count)}
      </div>
      <div className="mc-total">{fmt(row.total_amount ?? row.total)}</div>
      <div className="mc-sub">SMS дүн: {fmt(row.sms_total_amount)}</div>
      <div style={{ marginTop: 10 }}>
        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => onSelect(row)}>
          <i className="ti ti-eye" /> Нэхэмжлэл
        </button>
      </div>
    </div>
  );
}
