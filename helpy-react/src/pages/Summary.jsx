import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import { Loading, EmptyState, ErrorState } from '../components/common/Loading';
import { fmt, fmtN, pick } from '../utils/format';

// ШИНЭ: Hardcoded config-ийг дуудна
import { ORG_CONFIG } from '../config/orgConfig';

export default function Summary() {
  const showToast = useToast();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const endpoint = ORG_CONFIG.TYPE === 'tera' ? '/summary/tera' : '/summary/helpy';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API руу ORG_CONFIG.ID-г явуулна
      const { data } = await apiClient.get(endpoint, { params: { org_id: ORG_CONFIG.ID } });
      if (!data.success) throw new Error(data.error);
      
      setRow((data.data || []).find((r) => String(pick(r, 'ORG_ID', 'org_id')) === String(ORG_CONFIG.ID)) || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    function handler() { load(); showToast('Шинэчлэгдлээ', 'success'); }
    window.addEventListener('helpy:refresh', handler);
    return () => window.removeEventListener('helpy:refresh', handler);
  }, [load, showToast]);

  return (
    <div className="page active">
      <div className="card">
        <div className="card-header">
          <span className="card-title"><i className="ti ti-chart-bar" />{ORG_CONFIG.NAME} — Нийт хураангуй</span>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Байгууллага</th>
                  <th className="text-right">SMS тоо</th>
                  <th className="text-right">Дүн (НӨАТ-гүй)</th>
                  <th className="text-right">НӨАТ (10%)</th>
                  <th className="text-right">Нийт дүн</th>
                </tr>
              </thead>
              <tbody>
                {loading && <Loading colSpan={5} />}
                {!loading && error && <ErrorState colSpan={5} message={error} />}
                {!loading && !error && !row && <EmptyState colSpan={5} />}
                {!loading && !error && row && (
                  <tr style={{ fontWeight: 700 }}>
                    <td>{ORG_CONFIG.NAME}</td>
                    <td className="text-right">{fmtN(pick(row, 'SMS_COUNT', 'sms_count'))}</td>
                    <td className="text-right">{fmt(pick(row, 'SUBTOTAL', 'subtotal'))}</td>
                    <td className="text-right">{fmt(pick(row, 'VAT', 'vat'))}</td>
                    <td className="text-right" style={{ color: '#1a6ef5' }}>{fmt(pick(row, 'TOTAL', 'total'))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}