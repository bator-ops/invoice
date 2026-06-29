import React, { forwardRef } from 'react';
import { fmt, fmtN } from '../../utils/format';
import { ORG_CONFIG } from '../../config/orgConfig';

const InvoiceTemplate = forwardRef(({ orgName, periodLabel, row, visible }, ref) => {
  if (!row) return null;

  // SMS болон бусад дүнгүүд (Баазаас шууд авна)
  const smsCount = parseInt(row.SMS_COUNT || row.sms_count || 0);
  const smsAmount = parseFloat(row.SMS_TOTAL_AMOUNT || row.sms_total_amount || 0);
  const unitAccessCount = parseInt(row.UNIT_ACCESS_COUNT || row.unit_access_count || 0);
  const unitAccessAmt = parseFloat(row.UNIT_ACCESS_AMOUNT || row.unit_access_amount || 0);
  const baseFee = parseFloat(row.BASE_FEE || row.base_fee || 500000);
  
  const subTotal = baseFee + smsAmount + unitAccessAmt; // НӨАТ-гүй нийт дүн
  const vat = subTotal * 0.1; // НӨАТ (10%)
  const total = subTotal + vat; // Нийт төлөх дүн

  const today = new Date();
  
  // Баазаас ирж буй жинхэнэ нэхэмжлэхийн дугаар
  const invNo = row.invoice_id || row.INVOICE_ID || `HPY-${row.org_id || row.ORG_ID}-XXXXXX-01`;

  return (
    <div 
      ref={ref} 
      className="invoice-box" 
      style={{ 
        padding: '10px 40px 10px 40px',
        background: '#fff',
        display: visible ? 'block' : 'none',
        width: '100%',
        maxWidth: '800px', 
        boxSizing: 'border-box',
        color: '#333',
        fontFamily: 'Arial, sans-serif',
        margin: '0'
      }}
    >
     {/* ─── ТОЛГОЙН ХЭСГИЙН CSS (JSX файл дотор шууд) ─── */}
<style>{`
  .invoice-header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 0;
    margin-top: 0;
    padding-bottom: 30px;
    margin-bottom: 24px;
    border-bottom: 1px solid #787e84;
  }

  .invoice-header-logo {
    flex-shrink: 0;
  }

  .invoice-header-logo img {
    height: 42px;
    object-fit: contain;
    margin-top: 0;
    display: block;
  }

  .invoice-header-title {
    font-weight: bold;
    margin-bottom: 0;
    margin-top: 4px;
    color: #1e2e4a;
    font-size: 18px;
  }

  .invoice-header-info {
    text-align: right;
    flex-shrink: 0;
    margin-top: -8px;
  }

  .invoice-header-info .invoice-no {
    font-weight: bold;
    color: #000000;
    font-size: 13px;
  }

  .invoice-header-info .invoice-date {
    font-size: 14px;
    color: #8a9bc0;
  }
`}</style>

{/* ─── ТОЛГОЙН ХЭСЭГ (ЛОГО & ДУГААР) ─── */}
<div className="invoice-header">
  {/* ЗҪН ТАЛ — ЛОГО + НЭХЭМЖЛЭХ */}
  <div className="invoice-header-logo">
    <img
      src="/helpy-logo-original.png"
      alt="Helpy Platform"
      onError={(e) => {
        e.target.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'fw-bold fs-5 text-primary';
        fallback.innerText = 'Helpy Platform';
        e.target.parentNode.appendChild(fallback);
      }}
    />
    <h4 className="invoice-header-title">НЭХЭМЖЛЭХ</h4>
  </div>

  {/* БАРУУН ТАЛ — ДУГААР, ОГНОО */}
  <div className="invoice-header-info">
    <div className="invoice-no">№: {invNo}</div>
    <div className="invoice-date">Огноо: {today.toLocaleDateString('mn-MN')}</div>
  </div>
</div>
    {/* ─── ХАРИЛЦАГЧ ТАЛУУДЫН МЭДЭЭЛЭЛ ─── */}
<div
  style={{
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
  }}
>
  {/* ЗҪН ТАЛ — НЭХЭМЖЛЭГЧ */}
  <div style={{ width: '45%', flexShrink: 0 }}>
    <div className="fw-bold text-uppercase mb-1" style={{ fontSize: '10px', color: '#8a9bc0', letterSpacing: '0.5px' }}>
      Нэхэмжлэгч (Нийлүүлэгч)
    </div>
    <div className="fw-bold fs-6 mb-1" style={{ color: '#1e2e4a' }}>"Helpy.mn"</div>
    <div style={{ fontSize: '12px', color: '#5a6a85', lineHeight: '1.5' }}>
      <strong>Регистрийн дугаар:</strong> 1234567<br/>
      <strong>Утас:</strong> 7700-0000<br/>
      <strong>И-мэйл:</strong> billing@helpy.mn<br/>
      <strong>Хаяг:</strong> Улаанбаатар, СБД, 1-р хороо
    </div>
  </div>

  {/* БАРУУН ТАЛ — ТӨЛӨГЧ */}
  <div style={{ width: '45%', flexShrink: 0 }}>
    <div className="fw-bold text-uppercase mb-1" style={{ fontSize: '10px', color: '#8a9bc0', letterSpacing: '0.5px' }}>
      Төлөгч (Харилцагч)
    </div>
    <div className="fw-bold fs-6 mb-1" style={{ color: '#1e2e4a' }}>{orgName}</div>
    <div style={{ fontSize: '12px', color: '#5a6a85', lineHeight: '1.5' }}>
      <strong>Регистрийн дугаар:</strong> 1234567<br/>
      <strong>Утас:</strong> 7700-0000<br/>
      <strong>И-мэйл:</strong> billing@helpy.mn<br/>
      <strong>Хаяг:</strong> Улаанбаатар, СБД, 1-р хороо
    </div>
  </div>
</div>

      {/* ─── ҲЙЛЧИЛГЭЭНИЙ ЖАГСААЛТ & НИЙТ ДҮНГИЙН ХҮСНЭГТ ─── */}
<table
  style={{
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '28px',
    marginBottom: '20px',
    border: '1px solid #333',
  }}
>
  <thead>
    <tr style={{ background: '#f0f0f0' }}>
      <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', fontWeight: 700, color: '#000' }}>№</th>
      <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'left', fontWeight: 700, color: '#000' }}>Үйлчилгээний нэр</th>
      <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', fontWeight: 700, color: '#000' }}>Тоо хэмжээ</th>
      <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: '#000' }}>Нэгж үнэ</th>
      <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: '#000' }}>Нийт дүн</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', color: '#000' }}>1</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', color: '#000' }}>Платформ ашиглалтын суурь хураамж</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', color: '#000' }}>-</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', color: '#000' }}>-</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: '#000' }}>{fmt(baseFee)}</td>
    </tr>

    <tr>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', color: '#000' }}>2</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', color: '#000' }}>
        SMS мессеж илгээлт<br />
        <span style={{ fontSize: '11px', color: '#555' }}>Хугацаа: {periodLabel}</span>
      </td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', color: '#000' }}>{fmtN(smsCount)} ш</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', color: '#000' }}>55₮</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: '#000' }}>{fmt(smsAmount)}</td>
    </tr>

    {unitAccessAmt > 0 && (
      <tr>
        <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', color: '#000' }}>3</td>
        <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', color: '#000' }}>Ард апп нэгж хандалт</td>
        <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', color: '#000' }}>{fmtN(unitAccessCount)} ш</td>
        <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', color: '#000' }}>55₮</td>
        <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: '#000' }}>{fmt(unitAccessAmt)}</td>
      </tr>
    )}

    {/* ─── ДУНГИЙН ХУРААНГУЙ ─── */}
    <tr>
      <td colSpan="4" style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', color: '#000' }}>Дүн (НӨАТ-гүй):</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: '#000' }}>{fmt(subTotal)}</td>
    </tr>
    <tr>
      <td colSpan="4" style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', color: '#000' }}>НӨАТ (10%):</td>
      <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: '#000' }}>{fmt(vat)}</td>
    </tr>
    <tr style={{ background: '#f0f0f0' }}>
      <td colSpan="4" style={{ border: '1px solid #333', padding: '10px 10px', fontSize: '13px', textAlign: 'right', fontWeight: 700, color: '#000' }}>Нийт төлөх дүн:</td>
      <td style={{ border: '1px solid #333', padding: '10px 10px', fontSize: '14px', textAlign: 'right', fontWeight: 700, color: '#000' }}>{fmt(total)}</td>
    </tr>
  </tbody>
</table>

      {/* ─── БАНКНЫ МЭДЭЭЛЭЛ ─── */}
      <div className="mb-3" style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '6px', boxSizing: 'border-box', width: '100%' }}>
        <div className="fw-bold mb-1" style={{ color: '#1e2e4a', fontSize: '12px', letterSpacing: '0.5px' }}>ТӨЛБӨР ШИЛЖҮҮЛЭХ ДАНС:</div>
        <div style={{ fontSize: '12px', color: '#5a6a85', lineHeight: '1.6' }}>
          <strong>Хүлээн авагч банк:</strong> Хаан Банк | 
          <strong> Дансны дугаар:</strong> 5000 000 000 | 
          <strong> Дансны нэр:</strong> HELP.MN <br/>
          <strong>Гүйлгээний утга:</strong> <span className="text-danger fw-bold">{invNo}</span> тоот нэхэмжлэх
        </div>
      </div>
         <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ width: '45%', position: 'relative' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e2e4a', marginBottom: '12px' }}>Нэхэмжлэл гаргасан:</div>
              <div style={{ position: 'relative', height: '50px', width: '100%' }}>
                <img src="/signature.png" alt="Гарын үсэг" style={{ position: 'absolute', left: '50px', top: '-20px', height: '60px', zIndex: 2, pointerEvents: 'none' }} onError={(e) => e.target.style.display = 'none'} />
                <img src="/stamp.png" alt="Тамга" style={{ position: 'absolute', left: '100px', top: '-35px', height: '85px', zIndex: 1, opacity: 0.85, pointerEvents: 'none' }} onError={(e) => e.target.style.display = 'none'} />
              </div>
              <div style={{ fontSize: '12px', borderBottom: '1px dashed #ccc', paddingBottom: '6px' }}>Нягтлан бодогч: ................................... / ...................... /</div>
            </div>

            <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e2e4a', marginBottom: '12px' }}>Нэхэмжлэл хүлээн зөвшөөрсөн:</div>
              <div style={{ height: '50px' }}></div> 
              <div style={{ fontSize: '12px', borderBottom: '1px dashed #ccc', paddingBottom: '6px' }}>Захирал / Нягтлан: ........................... / ...................... /</div>
            </div>
          </div>
      </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;