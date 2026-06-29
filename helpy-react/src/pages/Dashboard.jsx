import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/common/StatCard';
import { Loading, EmptyState, ErrorState } from '../components/common/Loading';
import { fmt, fmtN, currentMonthLabel, pick } from '../utils/format';

// 1. Бидний үүсгэсэн тохиргооны файлыг дуудаж оруулж ирнэ
import { ORG_CONFIG } from '../config/orgConfig'; 

export default function Dashboard() {
  const showToast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orgSummary, setOrgSummary] = useState(null); // тухайн org-ийн нэг мөр

  // 2. ORG_CONFIG-оос төрлийг авч API замыг тодорхойлно
  const endpoint = ORG_CONFIG.TYPE === 'tera' ? '/summary/tera' : '/summary/helpy';

const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Бэкенд рүү ID-г явуулна
      const { data } = await apiClient.get(endpoint, { params: { org_id: ORG_CONFIG.ID } });
      if (!data.success) throw new Error(data.error);
      
      // ЗАСВАР: Бэкендээс ганцхан объект ирсэн үү, эсвэл массив ирсэн үү гэдгийг давхар шалгах
      let row = null;
      if (Array.isArray(data.data)) {
        row = data.data.find(
          (r) => String(pick(r, 'ORG_ID', 'org_id')).trim() === String(ORG_CONFIG.ID).trim()
        );
      } else if (data.data && typeof data.data === 'object') {
        // Хэрэв бэкенд шууд тухайн org-ийн датаг объект болгож буцаасан бол
        const rowId = String(pick(data.data, 'ORG_ID', 'org_id')).trim();
        if (rowId === String(ORG_CONFIG.ID).trim() || rowId === 'undefined') {
          row = data.data;
        }
      }
      
      setOrgSummary(row || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handler() { load(); showToast('Шинэчлэгдлээ', 'success'); }
    window.addEventListener('helpy:refresh', handler);
    return () => window.removeEventListener('helpy:refresh', handler);
  }, [load, showToast]);

  const sms = orgSummary ? pick(orgSummary, 'SMS_COUNT', 'sms_count') : 0;
  const subtotal = orgSummary ? pick(orgSummary, 'SUBTOTAL', 'subtotal') : 0;
  const vat = orgSummary ? pick(orgSummary, 'VAT', 'vat') : 0;
  const total = orgSummary ? pick(orgSummary, 'TOTAL', 'total') : 0;

  return (
    <div className="page active">
      <div className="stat-grid">
        <StatCard 
          icon="ti-message-2" 
          colorClass="si-blue" 
          value={loading ? '—' : fmtN(sms)} 
          label={`${ORG_CONFIG.NAME} — SMS тоо (энэ сар)`} 
        />
        <StatCard icon="ti-currency-tugrik" colorClass="si-green" value={loading ? '—' : fmt(subtotal)} label="Дүн (НӨАТ-гүй)" />
        <StatCard icon="ti-receipt-tax" colorClass="si-warn" value={loading ? '—' : fmt(vat)} label="НӨАТ (10%)" />
        <StatCard icon="ti-receipt" colorClass="si-purple" value={loading ? '—' : fmt(total)} label="Нийт төлөх дүн" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <i className={`ti ${ORG_CONFIG.TYPE === 'tera' ? 'ti-building-bank' : 'ti-building-hospital'}`} />
            {ORG_CONFIG.NAME} — Энэ сарын дэлгэрэнгүй
          </span>
          <span className="badge badge-month"><i className="ti ti-calendar" />{currentMonthLabel()}</span>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Байгууллага</th>
                  <th className="text-right">SMS тоо</th>
                  <th className="text-right">Дүн (НӨАТ-гүй)</th>
                  <th className="text-right">НӨАТ</th>
                  <th className="text-right">Нийт дүн</th>
                </tr>
              </thead>
              <tbody>
                {loading && <Loading colSpan={5} />}
                {!loading && error && <ErrorState colSpan={5} message={error} />}
                {!loading && !error && !orgSummary && <EmptyState colSpan={5} />}
                {!loading && !error && orgSummary && (
                  <tr>
                    <td><b>{ORG_CONFIG.NAME}</b></td>
                    <td className="text-right">{fmtN(sms)}</td>
                    <td className="text-right">{fmt(subtotal)}</td>
                    <td className="text-right">{fmt(vat)}</td>
                    <td className="text-right"><b>{fmt(total)}</b></td>
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