import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import { Loading, EmptyState, ErrorState } from '../components/common/Loading';
import MonthCard from '../components/invoice/MonthCard';
import InvoiceTemplate from '../components/invoice/InvoiceTemplate';
import { downloadInvoicePdf } from '../utils/pdf';
import { fmt, MN_MONTHS } from '../utils/format';

import { ORG_CONFIG } from '../config/orgConfig';

export default function InvoiceList() {
  const showToast = useToast();

  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Хэрэглэгчийн өөрөө CreateInvoice хуудаснаас үүсгэсэн нэхэмжлэлүүд
  const [manualInvoices, setManualInvoices] = useState([]);
  const [manualLoading, setManualLoading] = useState(true);
  const [manualError, setManualError] = useState(null);

  const pdfRef = useRef(null);
  const endpoint = ORG_CONFIG.TYPE === 'tera' ? '/invoice/tera' : '/invoice/helpy';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedMonth(null);
    try {
      const { data } = await apiClient.get(endpoint, { params: { org_id: ORG_CONFIG.ID } });
      if (!data.success) throw new Error(data.error);
      setMonths(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const loadManualInvoices = useCallback(async () => {
    setManualLoading(true);
    setManualError(null);
    try {
      const { data } = await apiClient.get('/client-invoice/list', { params: { org_id: ORG_CONFIG.ID } });
      if (!data.success) throw new Error(data.error);
      setManualInvoices(data.data || []);
    } catch (e) {
      setManualError(e.message);
    } finally {
      setManualLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadManualInvoices();
  }, [loadManualInvoices]);

  useEffect(() => {
    function handler() {
      load();
      loadManualInvoices();
      showToast('Шинэчлэгдлээ', 'success');
    }
    window.addEventListener('helpy:refresh', handler);
    return () => window.removeEventListener('helpy:refresh', handler);
  }, [load, loadManualInvoices, showToast]);

  function handleSelectMonth(row) {
    setSelectedMonth(row);
  }

  async function handleDownloadPdf() {
    if (!selectedMonth) return;
    setDownloading(true);
    window.scrollTo(0, 0);
    showToast('PDF файл руу хөрвүүлж байна. Түр хүлээнэ үү...', 'info');
    try {
      const invoiceId = selectedMonth.invoice_id || selectedMonth.INVOICE_ID || `Invoice_${selectedMonth.ym || selectedMonth.YM}`;
      const filename = `${invoiceId}`;

      await downloadInvoicePdf(pdfRef.current, filename);
      showToast('PDF файл амжилттай татагдлаа', 'success');
    } catch (e) {
      showToast('Алдаа: ' + e.message, 'error');
    } finally {
      setDownloading(false);
    }
  }

  const safeYear = selectedMonth?.year || selectedMonth?.YEAR || '';
  const safeMonth = selectedMonth?.month || selectedMonth?.MONTH || '';

  const periodLabel = selectedMonth
    ? `${safeYear} оны ${MN_MONTHS[parseInt(safeMonth, 10)] || safeMonth + '-р сар'}`
    : '';

  const getRowKey = (row) => row.ym || row.YM || row.billing_period || row.BILLING_PERIOD;

  return (
    <div className="page active">
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <i className={`ti ${ORG_CONFIG.TYPE === 'tera' ? 'ti-building-bank' : 'ti-building-hospital'}`} />
            {ORG_CONFIG.NAME} — Сарын нэхэмжлэлүүд
          </span>
        </div>
        <div className="card-body">
          {loading && <Loading />}
          {!loading && error && <ErrorState message={error} />}
          {!loading && !error && (
            <div className="month-grid">
              {months.length === 0
                ? <EmptyState icon="ti-calendar-off" />
                : months.map((row) => (
                    <MonthCard key={getRowKey(row)} row={row} onSelect={handleSelectMonth} />
                  ))}
            </div>
          )}
        </div>
      </div>

      {selectedMonth && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <i className="ti ti-file-invoice" />
              Нэхэмжлэл № {selectedMonth.invoice_id || selectedMonth.INVOICE_ID} — {ORG_CONFIG.NAME}
            </span>
            <button className="btn-success no-print" onClick={handleDownloadPdf} disabled={downloading}>
              <i className="ti ti-download" /> {downloading ? 'Татаж байна...' : 'PDF татах'}
            </button>
          </div>
          <div className="card-body" style={{ background: '#fff' }}>
            <InvoiceTemplate
              ref={pdfRef}
              orgName={ORG_CONFIG.NAME}
              periodLabel={periodLabel}
              row={selectedMonth}
              visible
            />
          </div>
        </div>
      )}

      {/* ─── ӨӨРӨӨ ҮҮСГЭСЭН НЭХЭМЖЛЭЛҮҮД ─── */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <span className="card-title">
            <i className="ti ti-file-text" />
            Миний үүсгэсэн нэхэмжлэлүүд
          </span>
        </div>
        <div className="card-body">
          {manualLoading && <Loading />}
          {!manualLoading && manualError && <ErrorState message={manualError} />}
          {!manualLoading && !manualError && (
            manualInvoices.length === 0
              ? <EmptyState icon="ti-file-off" />
              : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Харилцагч</th>
                      <th>Хугацаа</th>
                      <th>Дүн</th>
                      <th>Огноо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualInvoices.map(inv => {
                      const invId = inv.INVOICE_ID || inv.invoice_id;
                      const custName = inv.CUSTOMER_NAME || inv.customer_name;
                      const period = inv.BILLING_PERIOD || inv.billing_period;
                      const totalAmt = inv.TOTAL_AMOUNT || inv.total_amount;
                      const createdAt = inv.CREATED_AT || inv.created_at;
                      return (
                        <tr key={invId}>
                          <td>{invId}</td>
                          <td>{custName}</td>
                          <td>{period}</td>
                          <td>{fmt(totalAmt)}</td>
                          <td>{createdAt ? new Date(createdAt).toLocaleDateString('mn-MN') : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
          )}
        </div>
      </div>
    </div>
  );
}