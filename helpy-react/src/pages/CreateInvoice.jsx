import React, { useState, useRef, useEffect } from 'react';
import { fmt, fmtN } from '../utils/format';
import { ORG_CONFIG } from '../config/orgConfig';
import { downloadInvoicePdf } from '../utils/pdf';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';

export default function CreateInvoice() {
  const printRef = useRef();
  const showToast = useToast();

  const todayObj = new Date();
  const currentMonthVal = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}`;

  const [customer, setCustomer] = useState({
    name: '',
    register: '',
    phone: '',
    email: '',
    address: '',
    period: currentMonthVal,
    invNo: '',
  });

  const [items, setItems] = useState([
    { id: 1, name: 'Платформ ашиглалтын суурь хураамж', qty: 1, price: 500000 }
  ]);

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [images, setImages] = useState({
    logo: '',
    signature: '/signature.png',
    stamp: '/stamp.png'
  });

  useEffect(() => {
    function handleRefresh() {
      setCustomer({
        name: '', register: '', phone: '', email: '', address: '', period: currentMonthVal,
        invNo: ''
      });
      setItems([{ id: 1, name: 'Платформ ашиглалтын суурь хураамж', qty: 1, price: 500000 }]);
      setImages({ logo: '', signature: '/signature.png', stamp: '/stamp.png' });
      setErrors({});
    }
    window.addEventListener('helpy:refresh', handleRefresh);
    return () => window.removeEventListener('helpy:refresh', handleRefresh);
  }, [currentMonthVal]);

  const handleClientChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') value = value.replace(/[^0-9\-\+]/g, '');
    if (name === 'register') value = value.toUpperCase();

    setCustomer({ ...customer, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleItemChange = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addItem = () => setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0 }]);
  const removeItem = (id) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => ({ ...prev, [type]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const subTotal = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const vat = subTotal * 0.1;
  const total = subTotal + vat;
  const today = new Date();

  // ФОРМ ШАЛГАХ ФУНКЦ
  const validateForm = () => {
    const newErrors = {};
    if (!customer.invNo.trim()) newErrors.invNo = 'Нэхэмжлэхийн дугаараа оруулна уу.';
    if (!customer.name.trim()) newErrors.name = 'Байгууллагын нэрээ оруулна уу.';
    if (!customer.register.trim()) newErrors.register = 'Регистрийн дугаараа оруулна уу.';
    if (!customer.phone.trim()) newErrors.phone = 'Утасны дугаараа оруулна уу.';

    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = 'И-мэйл хаяг буруу байна.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Мэдээллээ гүйцэд бөглөнө үү!', 'error');
      return false;
    }
    return true;
  };

  const saveToDatabase = async () => {
    try {
      const saveEndpoint = '/client-invoice/create';
      const payload = {
        org_id: ORG_CONFIG.ID,
        invoice_id: customer.invNo,
        customer_name: customer.name,
        register_no: customer.register,
        billing_period: customer.period,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        total_amount: total,
        items: JSON.stringify(items)
      };
      await apiClient.post(saveEndpoint, payload);
      return true;
    } catch (err) {
      console.error("Хадгалах алдаа:", err);
      showToast("Хадгалахад алдаа гарлаа: " + (err.response?.data?.error || err.response?.data?.message || err.message), 'error');
      return false;
    }
  };

  // 1-Р ТОВЧ: ЗӨВХӨН PDF ТАТАХ
  const handleDownloadPdf = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const isSaved = await saveToDatabase();
      if (isSaved) {
        window.scrollTo(0, 0);
        await downloadInvoicePdf(printRef.current, customer.invNo);
        showToast('Амжилттай хадгалагдаж, PDF татагдлаа', 'success');
        // Бусад хуудаснуудад (InvoiceList гэх мэт) шинэ нэхэмжлэлийг шууд харуулахын тулд жагсаалтыг сэргээх
        window.dispatchEvent(new Event('helpy:refresh'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 2-Р ТОВЧ: ИМЭЙЛ ИЛГЭЭХ
  const handleSendEmail = async () => {
    if (!validateForm()) return;

    if (!customer.email.trim()) {
      showToast('Харилцагчийн и-мэйл хаягийг оруулна уу!', 'error');
      setErrors((prev) => ({ ...prev, email: 'И-мэйл хаяг шаардлагатай' }));
      return;
    }

    setIsSending(true);
    try {
      const isSaved = await saveToDatabase();
      if (isSaved) {
        // ЗАСВАР: apiClient нь өөрөө /api baseURL-тэй тул эндээс '/api' давхар оруулахгүй
        const EMAIL_API_URL = '/send-invoice-email';

        const emailPayload = {
          invoice_id: customer.invNo,
          customer_name: customer.name,
          email: customer.email,
          total_amount: total,
          period: customer.period,
          org_id: ORG_CONFIG.ID,
          operator_id: ORG_CONFIG.OPERATOR_ID,
          deal_id: ORG_CONFIG.DEAL_ID
        };

        await apiClient.post(EMAIL_API_URL, emailPayload);
        showToast('Нэхэмжлэх амжилттай илгээгдлээ!', 'success');
        window.dispatchEvent(new Event('helpy:refresh'));
      }
    } catch (err) {
      console.error("Имэйл илгээх алдаа:", err);
      showToast("Имэйл илгээхэд алдаа гарлаа: " + (err.response?.data?.error || err.response?.data?.message || err.message), 'error');
    } finally {
      setIsSending(false);
    }
  };

  const formatPeriod = (val) => {
    if (!val) return '....................';
    if (val.includes('-')) {
      const [year, month] = val.split('-');
      return `${year} оны ${parseInt(month, 10)}-р сар`;
    }
    return val;
  };

  return (
    <div className="page active p-4" style={{ overflowY: 'auto', height: '100vh', background: '#f1f5f9' }}>

      <style>{`
        .form-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 30px; margin-bottom: 30px; max-width: 1000px; margin-left: 0; }
        .form-section-title { font-size: 16px; font-weight: 700; color: #1e2e4a; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .form-section-title.section-stamp { margin-top: 35px; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 35px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 13px; font-weight: 600; color: #475569; margin: 0; }

        .modern-input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #1e293b; outline: none; background: #f8fafc; box-sizing: border-box; display: block; transition: all 0.2s;}
        .modern-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .modern-input[type="file"] { padding: 6px 12px; cursor: pointer; background: #fff; }
        select.modern-input { appearance: auto; cursor: pointer; }

        .modern-input.is-invalid { border-color: #ef4444 !important; background: #fef2f2 !important; }
        .modern-input.is-invalid:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important; }
        .error-text { color: #ef4444; font-size: 11px; font-weight: 600; margin-top: 2px; }
        .req-star { color: #ef4444; margin-left: 3px; }

        .item-row-container { display: flex; flex-direction: row; align-items: center; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 16px; box-sizing: border-box; }
        .field-name { flex: 1; min-width: 150px; }
        .field-qty { width: 90px; flex-shrink: 0; }
        .field-price { width: 140px; flex-shrink: 0; }

        .btn-modern { padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary-m { background: #10b981; color: white; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2); }
        .btn-primary-m:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }
        .btn-primary-m:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
        .btn-secondary-m { background: #fff; color: #475569; border: 1px solid #cbd5e1; }
        .btn-secondary-m:hover:not(:disabled) { background: #f1f5f9; }
        .btn-secondary-m:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
        .btn-danger-m { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; width: 38px; height: 38px; display: flex; justify-content: center; align-items: center; padding: 0; }
        .btn-danger-m:hover { background: #ef4444; color: white; border-color: #ef4444; }
      `}</style>

      <div className="form-card no-print">
        <div className="form-section-title">
          <i className="ti ti-building" style={{ fontSize: '18px', color: '#3b82f6' }} />
          1. Төлөгч харилцагчийн мэдээлэл
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Нэхэмжлэхийн дугаар <span className="req-star">*</span></label>
            <input
              type="text"
              className={`modern-input ${errors.invNo ? 'is-invalid' : ''}`}
              name="invNo"
              value={customer.invNo}
              onChange={handleClientChange}
              placeholder="Жишээ: 001"
            />
            {errors.invNo && <div className="error-text">{errors.invNo}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Байгууллагын нэр <span className="req-star">*</span></label>
            <input
              type="text"
              className={`modern-input ${errors.name ? 'is-invalid' : ''}`}
              name="name"
              value={customer.name}
              onChange={handleClientChange}
              placeholder="Жишээ: Компани ХХК"
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Регистрийн дугаар <span className="req-star">*</span></label>
            <input
              type="text"
              className={`modern-input ${errors.register ? 'is-invalid' : ''}`}
              name="register"
              value={customer.register}
              onChange={handleClientChange}
              placeholder="1234567"
            />
            {errors.register && <div className="error-text">{errors.register}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Тооцооны хугацаа</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="modern-input"
                style={{ flex: 1 }}
                value={customer.period.split('-')[0] || todayObj.getFullYear()}
                onChange={(e) => {
                  const newYear = e.target.value;
                  const currentMonth = customer.period.split('-')[1] || String(todayObj.getMonth() + 1).padStart(2, '0');
                  setCustomer({...customer, period: `${newYear}-${currentMonth}`});
                }}
              >
                {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y} он</option>
                ))}
              </select>
              <select
                className="modern-input"
                style={{ flex: 1 }}
                value={customer.period.split('-')[1] || String(todayObj.getMonth() + 1).padStart(2, '0')}
                onChange={(e) => {
                  const currentYear = customer.period.split('-')[0] || todayObj.getFullYear();
                  const newMonth = e.target.value;
                  setCustomer({...customer, period: `${currentYear}-${newMonth}`});
                }}
              >
                {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{parseInt(m)}-р сар</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Утасны дугаар <span className="req-star">*</span></label>
            <input
              type="tel"
              className={`modern-input ${errors.phone ? 'is-invalid' : ''}`}
              name="phone"
              value={customer.phone}
              onChange={handleClientChange}
              placeholder="9911-XXXX"
            />
            {errors.phone && <div className="error-text">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">И-мэйл хаяг</label>
            <input
              type="email"
              className={`modern-input ${errors.email ? 'is-invalid' : ''}`}
              name="email"
              value={customer.email}
              onChange={handleClientChange}
              placeholder="info@company.mn"
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Хаяг байршил</label>
            <input type="text" className="modern-input" name="address" value={customer.address} onChange={handleClientChange} placeholder="Улаанбаатар, СБД..." />
          </div>
        </div>

        <div className="form-section-title">
          <i className="ti ti-list-check" style={{ fontSize: '18px', color: '#3b82f6' }} />
          2. Нэхэмжлэх үйлчилгээний мөрүүд
        </div>

        {/* Баганын толгой хэсэг */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', padding: '0 16px 8px 16px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
          <div style={{ width: '30px', textAlign: 'center', flexShrink: 0 }}>№</div>
          <div className="field-name">Үйлчилгээний нэр / Тайлбар</div>
          <div className="field-qty" style={{ textAlign: 'center' }}>Тоо ширхэг</div>
          <div className="field-price" style={{ textAlign: 'right' }}>Нэгж үнэ ₮</div>
          <div style={{ width: '120px', textAlign: 'right', flexShrink: 0 }}>Нийт үнэ ₮</div>
          <div style={{ width: '38px', flexShrink: 0 }}></div>
        </div>

        {items.map((item, index) => {
          const rowTotal = (Number(item.qty || 0) * Number(item.price || 0));
          return (
            <div className="item-row-container" key={item.id}>
              <div style={{ width: '30px', fontWeight: 'bold', color: '#64748b', textAlign: 'center', flexShrink: 0 }}>{index + 1}</div>

              <div className="field-name">
                <input
                  type="text"
                  className="modern-input"
                  style={{ width: '100%', background: '#fff' }}
                  placeholder="Үйлчилгээний нэр"
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                />
              </div>

              <div className="field-qty">
                <input
                  type="number"
                  min="0"
                  className="modern-input"
                  style={{ width: '100%', textAlign: 'right', background: '#fff' }}
                  placeholder="Тоо"
                  value={item.qty}
                  onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                />
              </div>

              <div className="field-price">
                <input
                  type="number"
                  min="0"
                  className="modern-input"
                  style={{ width: '100%', textAlign: 'right', background: '#fff' }}
                  placeholder="Нэгж үнэ"
                  value={item.price}
                  onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                />
              </div>

              <div style={{ width: '120px', textAlign: 'right', fontWeight: '600', color: '#1e293b', flexShrink: 0, fontSize: '14px' }}>
                {fmt(rowTotal)}
              </div>

              <div style={{ flexShrink: 0 }}>
                <button className="btn-modern btn-danger-m" onClick={() => removeItem(item.id)} title="Мөр устгах">
                  <i className="ti ti-trash" style={{ fontSize: '16px' }} />
                </button>
              </div>
            </div>
          );
        })}

        <button className="btn-modern btn-secondary-m mt-2" style={{ marginBottom: '30px' }} onClick={addItem}>
          <i className="ti ti-plus" /> Шинэ мөр нэмэх
        </button>

        <div className="form-section-title section-stamp">
          <i className="ti ti-photo" style={{ fontSize: '18px', color: '#3b82f6' }} />
          3. Байгууллагын лого, тамга, гарын үсэг оруулах
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Байгууллагын Лого</label>
            <input type="file" className="modern-input" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
          </div>
          <div className="form-group">
            <label className="form-label">Гарын үсэг (PNG)</label>
            <input type="file" className="modern-input" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} />
          </div>
          <div className="form-group">
            <label className="form-label">Байгууллагын Тамга (PNG)</label>
            <input type="file" className="modern-input" accept="image/*" onChange={(e) => handleImageUpload(e, 'stamp')} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '35px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '15px', color: '#475569' }}>
            Нийт дүн: <strong style={{ fontSize: '18px', color: '#1e293b' }}>{fmt(total)}</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-modern btn-secondary-m"
              onClick={handleDownloadPdf}
              disabled={isSaving || isSending}
            >
              <i className="ti ti-download" /> {isSaving ? 'Уншиж байна...' : 'PDF татах'}
            </button>

            <button
              className="btn-modern btn-primary-m"
              onClick={handleSendEmail}
              disabled={isSaving || isSending}
            >
              <i className="ti ti-send" /> {isSending ? 'Илгээж байна...' : 'Нэхэмжлэх илгээх'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── ХЭВЛЭГДЭХ БОДИТ ХАРАГДАЦ ─── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', maxWidth: '1000px', marginLeft: '0' }} className="no-print-bg">
        <div
          ref={printRef}
          className="invoice-box"
          style={{
            padding: '25px 40px', background: '#fff', width: '100%', maxWidth: '800px',
            boxSizing: 'border-box', color: '#333', fontFamily: 'Arial, sans-serif', margin: '0 AUTO',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}
        >
          <style>{`
            .invoice-header { display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end; padding-bottom: 30px; margin-bottom: 24px; border-bottom: 1px solid #787e84; }
            .invoice-header-logo img { height: 42px; object-fit: contain; margin-top: 0; display: block; max-width: 250px; }
            .invoice-header-title { font-weight: bold; margin-bottom: 0; margin-top: 4px; color: #1e2e4a; font-size: 18px; }
            .invoice-header-info { text-align: right; margin-top: -8px; }
            .invoice-header-info .invoice-no { font-weight: bold; color: #000; font-size: 13px; }
            .invoice-header-info .invoice-date { font-size: 14px; color: #8a9bc0; }
          `}</style>

          <div className="invoice-header">
            <div className="invoice-header-logo">
              {images.logo ? <img src={images.logo} alt="Лого" /> : <div style={{height: '42px'}}></div>}
              <h4 className="invoice-header-title">НЭХЭМЖЛЭХ</h4>
            </div>
            <div className="invoice-header-info">
              <div className="invoice-no">№: {customer.invNo}</div>
              <div className="invoice-date">Огноо: {today.toLocaleDateString('mn-MN')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ width: '45%' }}>
              <div style={{ fontSize: '10px', color: '#8a9bc0', fontWeight: 'bold', marginBottom: '4px' }}>Нэхэмжлэгч (Нийлүүлэгч)</div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e2e4a', marginBottom: '4px' }}>{ORG_CONFIG.NAME || 'Компани ХХК'}</div>
              <div style={{ fontSize: '12px', color: '#5a6a85', lineHeight: '1.5' }}>
                <strong>Регистрийн дугаар:</strong> 1234567<br/>
                <strong>Утас:</strong> 7700-0000<br/>
                <strong>И-мэйл:</strong> billing@invoice.mn<br/>
                <strong>Хаяг:</strong> Улаанбаатар, СБД, 1-р хороо
              </div>
            </div>

            <div style={{ width: '45%' }}>
              <div style={{ fontSize: '10px', color: '#8a9bc0', fontWeight: 'bold', marginBottom: '4px' }}>Төлөгч (Харилцагч)</div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e2e4a', marginBottom: '4px' }}>{customer.name || '...........................................'}</div>
              <div style={{ fontSize: '12px', color: '#5a6a85', lineHeight: '1.5' }}>
                <strong>Регистрийн дугаар:</strong> {customer.register || '............'}<br/>
                <strong>Тооцооны хугацаа:</strong> {formatPeriod(customer.period)}<br/>
                <strong>Утас:</strong> {customer.phone}<br/>
                <strong>И-мэйл:</strong> {customer.email}<br/>
                <strong>Хаяг:</strong> {customer.address}
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '28px', marginBottom: '20px', border: '1px solid #333' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', fontWeight: 700 }}>№</th>
                <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'left', fontWeight: 700 }}>Үйлчилгээний нэр</th>
                <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center', fontWeight: 700 }}>Тоо хэмжээ</th>
                <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>Нэгж үнэ</th>
                <th style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>Нийт дүн</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px' }}>{item.name || 'Үйлчилгээний нэр оруулаагүй'}</td>
                  <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'center' }}>{item.qty ? fmtN(item.qty) : '-'}</td>
                  <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right' }}>{item.price ? fmt(item.price) : '-'}</td>
                  <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>{fmt((item.qty || 0) * (item.price || 0))}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="4" style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right' }}>Дүн (НӨАТ-гүй):</td>
                <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>{fmt(subTotal)}</td>
              </tr>
              <tr>
                <td colSpan="4" style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right' }}>НӨАТ (10%):</td>
                <td style={{ border: '1px solid #333', padding: '8px 10px', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>{fmt(vat)}</td>
              </tr>
              <tr style={{ background: '#f0f0f0' }}>
                <td colSpan="4" style={{ border: '1px solid #333', padding: '10px 10px', fontSize: '13px', textAlign: 'right', fontWeight: 700 }}>Нийт төлөх дүн:</td>
                <td style={{ border: '1px solid #333', padding: '10px 10px', fontSize: '14px', textAlign: 'right', fontWeight: 700 }}>{fmt(total)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '6px', marginBottom: '35px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1e2e4a', marginBottom: '4px' }}>ТӨЛБӨР ШИЛЖҮҮЛЭХ ДАНС:</div>
            <div style={{ fontSize: '12px', color: '#5a6a85', lineHeight: '1.6' }}>
              <strong>Хүлээн авагч банк:</strong> Хаан Банк | <strong>Дансны дугаар:</strong> 5000 000 000 | <strong>Дансны нэр:</strong> Компани ХХК<br/>
              <strong>Гүйлгээний утга:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{customer.invNo}</span> тоот нэхэмжлэх
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ width: '45%', position: 'relative' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e2e4a', marginBottom: '12px' }}>Нэхэмжлэл гаргасан:</div>
              <div style={{ position: 'relative', height: '50px', width: '100%' }}>
                {images.signature && <img src={images.signature} alt="Гарын үсэг" style={{ position: 'absolute', left: '50px', top: '-20px', height: '60px', zIndex: 2, pointerEvents: 'none' }} onError={(e) => e.target.style.display = 'none'} />}
                {images.stamp && <img src={images.stamp} alt="Тамга" style={{ position: 'absolute', left: '100px', top: '-35px', height: '85px', zIndex: 1, opacity: 0.85, pointerEvents: 'none' }} onError={(e) => e.target.style.display = 'none'} />}
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
      </div>
    </div>
  );
}