const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db');

const SMS_PRICE = parseFloat(process.env.SMS_PRICE || 55);
const VAT_RATE  = parseFloat(process.env.VAT_RATE  || 0.1);
const BASE_FEE  = parseFloat(process.env.BASE_FEE  || 500000);

// Баазаас ирсэн датаг форматлах
function calcInvoice(row) {
  const cnt = parseInt(row.SMS_COUNT || row.sms_count || 0);
  const accessCnt = parseInt(row.UNIT_ACCESS_COUNT || row.unit_access_count || 0);
  const base = parseFloat(row.BASE_FEE || row.base_fee || BASE_FEE);

  const smsAmt = cnt * SMS_PRICE;
  const accessAmt = accessCnt * SMS_PRICE;
  const subtotal = base + smsAmt + accessAmt;
  const vat = subtotal * VAT_RATE;

  const period = row.BILLING_PERIOD || row.billing_period || row.YM || row.ym || '';
  const calculatedYear = period ? period.substring(0, 4) : new Date().getFullYear().toString();
  const calculatedMonth = period ? period.substring(5, 7) : String(new Date().getMonth() + 1).padStart(2, '0');

  return {
    invoice_id:         row.INVOICE_ID || row.invoice_id,
    company_name:       row.COMPANY_NAME || row.company_name,
    year:               calculatedYear,
    month:              calculatedMonth,
    ym:                 period,
    billing_period:     period,
    sms_count:          cnt,
    sms_total_amount:   smsAmt,
    unit_access_count:  accessCnt,
    unit_access_amount: accessAmt,
    base_fee:           base,
    vat:                vat,
    total_amount:       subtotal + vat,
    status:             row.STATUS || row.status || 'Төлөгдөөгүй'
  };
}

// ─── 1. Байгууллагын жагсаалт ───────────────────────────────────────────────
router.get('/organizations/helpy', async (req, res) => {
  try {
    const sql = `SELECT DISTINCT org_id, company_name AS org_name FROM AXIS_SOCIAL.invoices WHERE org_id IS NOT NULL ORDER BY org_name`;
    const result = await executeQuery(sql);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/organizations/tera', async (req, res) => {
  try {
    const sql = `SELECT DISTINCT org_id, company_name AS org_name FROM AXIS_SOCIAL.invoices WHERE org_id IS NOT NULL ORDER BY org_name`;
    const result = await executeQuery(sql);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Сарын нэхэмжлэлийн жагсаалт ─────────────────────────────────────────
router.get('/invoice/helpy', async (req, res) => {
  try {
    const { org_id } = req.query;
    if (!org_id) return res.status(400).json({ success: false, error: 'org_id шаардлагатай' });

    const sql = `
      SELECT invoice_id, company_name, billing_period, sms_count, sms_total_amount,
             unit_access_count, unit_access_amount, base_fee, total_amount, status, org_id
      FROM AXIS_SOCIAL.invoices
      WHERE org_id = :1
      ORDER BY billing_period
    `;
    const result = await executeQuery(sql, [String(org_id).trim()]);
    const data = result.rows.map(r => calcInvoice(r));
    res.json({ success: true, data, type: 'helpy' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/invoice/tera', async (req, res) => {
  try {
    const { org_id } = req.query;
    if (!org_id) return res.status(400).json({ success: false, error: 'org_id шаардлагатай' });

    const sql = `
      SELECT invoice_id, company_name, billing_period, sms_count, sms_total_amount,
             unit_access_count, unit_access_amount, base_fee, total_amount, status, org_id
      FROM AXIS_SOCIAL.invoices
      WHERE org_id = :1
      ORDER BY billing_period
    `;
    const result = await executeQuery(sql, [String(org_id).trim()]);
    const data = result.rows.map(r => calcInvoice(r));
    res.json({ success: true, data, type: 'tera' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. Нийт хураангуй (Dashboard-д зориулсан) ──────────────────────────────
router.get('/summary/helpy', async (req, res) => {
  try {
    const { org_id } = req.query;
    let sql = `
      SELECT org_id AS ORG_ID,
             MAX(company_name) AS ORG_NAME,
             SUM(sms_count) AS SMS_COUNT,
             SUM(unit_access_count) AS UNIT_ACCESS_COUNT,
             SUM(base_fee + sms_total_amount + unit_access_amount) AS SUBTOTAL,
             SUM(base_fee + sms_total_amount + unit_access_amount) * 0.1 AS VAT,
             SUM(total_amount) AS TOTAL
      FROM AXIS_SOCIAL.invoices
    `;

    const binds = [];
    if (org_id) {
      sql += ` WHERE org_id = :1 `;
      binds.push(String(org_id).trim());
    }
    sql += ` GROUP BY org_id ORDER BY TOTAL DESC`;

    const result = await executeQuery(sql, binds);
    const data = result.rows.map(row => ({
      org_id:            row.ORG_ID,
      org_name:          row.ORG_NAME,
      sms_count:         row.SMS_COUNT         || 0,
      unit_access_count: row.UNIT_ACCESS_COUNT || 0,
      subtotal:          row.SUBTOTAL          || 0,
      vat:               row.VAT               || 0,
      total:             row.TOTAL             || 0,
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/summary/tera', async (req, res) => {
  try {
    const { org_id } = req.query;
    let sql = `
      SELECT org_id AS ORG_ID,
             MAX(company_name) AS ORG_NAME,
             SUM(sms_count) AS SMS_COUNT,
             SUM(unit_access_count) AS UNIT_ACCESS_COUNT,
             SUM(base_fee + sms_total_amount + unit_access_amount) AS SUBTOTAL,
             SUM(base_fee + sms_total_amount + unit_access_amount) * 0.1 AS VAT,
             SUM(total_amount) AS TOTAL
      FROM AXIS_SOCIAL.invoices
    `;

    const binds = [];
    if (org_id) {
      sql += ` WHERE org_id = :1 `;
      binds.push(String(org_id).trim());
    }
    sql += ` GROUP BY org_id ORDER BY TOTAL DESC`;

    const result = await executeQuery(sql, binds);
    const data = result.rows.map(row => ({
      org_id:            row.ORG_ID,
      org_name:          row.ORG_NAME,
      sms_count:         row.SMS_COUNT         || 0,
      unit_access_count: row.UNIT_ACCESS_COUNT || 0,
      subtotal:          row.SUBTOTAL          || 0,
      vat:               row.VAT               || 0,
      total:             row.TOTAL             || 0,
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. Нэхэмжлэх Шинээр Үүсгэх / Шинэчлэх (UPSERT) ──────────────────────────
router.post('/invoice/save', async (req, res) => {
  try {
    const { org_id, company_name, billing_period, sms_count, unit_access_count } = req.body;

    if (!org_id || !company_name || !billing_period || sms_count == null) {
      return res.status(400).json({ success: false, error: 'Мэдээлэл дутуу байна' });
    }

    const cnt = parseInt(sms_count);
    const accessCnt = parseInt(unit_access_count || 0);
    const yr = billing_period.substring(0, 4);
    const mn = billing_period.substring(5, 7);
    const cleanYM = `${yr}${mn}`;

    const invoiceId = `HPY-${org_id}-${cleanYM}-01`;

    const smsTotalAmount = cnt * SMS_PRICE;
    const unitAccessAmt = accessCnt * SMS_PRICE;
    const subtotal = BASE_FEE + smsTotalAmount + unitAccessAmt;
    const vat = subtotal * VAT_RATE;
    const totalAmount = subtotal + vat;

    const checkSql = `SELECT COUNT(*) AS CNT FROM AXIS_SOCIAL.invoices WHERE invoice_id = :1`;
    const checkResult = await executeQuery(checkSql, [invoiceId]);
    const exists = parseInt(checkResult.rows[0].CNT || 0) > 0;

    if (!exists) {
      const insertSql = `
        INSERT INTO AXIS_SOCIAL.invoices (
          invoice_id, company_name, invoice_date, base_fee, sms_count,
          sms_total_amount, unit_access_count, unit_access_amount, total_amount, status, org_id, billing_period
        ) VALUES (
          :1, :2, SYSDATE, :3, :4, :5, :6, :7, :8, 'Төлөгдөөгүй', :9, :10
        )
      `;
      await executeQuery(insertSql, [
        invoiceId, company_name, BASE_FEE, cnt, smsTotalAmount, accessCnt, unitAccessAmt, totalAmount, String(org_id).trim(), billing_period
      ]);
      res.json({ success: true, message: "Шинэ сарын нэхэмжлэл үүслээ", data: { invoice_id: invoiceId, status: 'Төлөгдөөгүй' } });
    } else {
      const updateSql = `
        UPDATE AXIS_SOCIAL.invoices
        SET sms_count = :1, sms_total_amount = :2, unit_access_count = :3, unit_access_amount = :4, total_amount = :5, company_name = :6
        WHERE invoice_id = :7
      `;
      await executeQuery(updateSql, [cnt, smsTotalAmount, accessCnt, unitAccessAmt, totalAmount, company_name, invoiceId]);
      res.json({ success: true, message: "Энэ сарын нэхэмжлэлийн дүн шинэчлэгдлээ", data: { invoice_id: invoiceId, status: 'Шинэчлэгдсэн' } });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Нэхэмжлэлийн төлөв шинэчлэх ──────────────────────────────────────────
router.patch('/invoice/:invoice_id/status', async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'status шаардлагатай' });

    await executeQuery(`UPDATE AXIS_SOCIAL.invoices SET status = :1 WHERE invoice_id = :2`, [status, invoice_id]);
    res.json({ success: true, data: { invoice_id, status } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. Хэрэглэгчийн өөрөө үүсгэсэн нэхэмжлэл — Хадгалах (UPSERT) ───────────
router.post('/client-invoice/create', async (req, res) => {
  try {
    const {
      org_id,
      invoice_id,
      customer_name,
      register_no,
      billing_period,
      phone,
      email,
      address,
      total_amount,
      items
    } = req.body;

    if (!org_id || !invoice_id || !customer_name || !register_no) {
      return res.status(400).json({ success: false, error: 'Заавал бөглөх мэдээлэл дутуу байна (org_id, invoice_id, customer_name, register_no)' });
    }

    const sql = `
      MERGE INTO AXIS_SOCIAL.client_created_invoices tgt
      USING (SELECT :org_id AS ORG_ID, :invoice_id AS INVOICE_ID FROM dual) src
      ON (tgt.org_id = src.ORG_ID AND tgt.invoice_id = src.INVOICE_ID)
      WHEN MATCHED THEN UPDATE SET
        customer_name  = :customer_name,
        register_no    = :register_no,
        billing_period = :billing_period,
        phone          = :phone,
        email          = :email,
        address        = :address,
        total_amount   = :total_amount,
        items          = :items
      WHEN NOT MATCHED THEN INSERT (
        org_id, invoice_id, customer_name, register_no, billing_period,
        phone, email, address, total_amount, items, created_at
      ) VALUES (
        :org_id, :invoice_id, :customer_name, :register_no, :billing_period,
        :phone, :email, :address, :total_amount, :items, CURRENT_TIMESTAMP
      )
    `;

    await executeQuery(sql, {
      org_id:         Number(org_id),
      invoice_id:     String(invoice_id).trim(),
      customer_name,
      register_no,
      billing_period: billing_period || null,
      phone:          phone || null,
      email:          email || null,
      address:        address || null,
      total_amount:   Number(total_amount),
      items:          items || '[]'
    });

    res.json({
      success: true,
      message: "Нэхэмжлэл өгөгдлийн санд амжилттай хадгалагдлаа",
      data: { invoice_id }
    });

  } catch (err) {
    console.error("Oracle хадгалах үеийн алдаа:", err);
    res.status(500).json({ success: false, error: "Баазад хадгалахад алдаа гарлаа: " + err.message });
  }
});

// ─── 7. Хэрэглэгчийн өөрөө үүсгэсэн нэхэмжлэлийн жагсаалт ──────────────────
router.get('/client-invoice/list', async (req, res) => {
  try {
    const { org_id } = req.query;
    if (!org_id) return res.status(400).json({ success: false, error: 'org_id шаардлагатай' });

    const sql = `
      SELECT org_id, invoice_id, customer_name, register_no, billing_period,
             phone, email, address, total_amount, items, created_at
        FROM AXIS_SOCIAL.client_created_invoices
       WHERE org_id = :org_id
       ORDER BY created_at DESC
    `;
    const result = await executeQuery(sql, { org_id: Number(org_id) });
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 8. Нэхэмжлэлийг и-мэйлээр илгээх (helpy.mn-ийн алдаа засах хамгаалалттай) ───
router.post('/send-invoice-email', async (req, res) => {
  try {
    const { invoice_id, customer_name, email, total_amount, period, org_id, operator_id, deal_id } = req.body;

    // Фронтоос ирж буй 'email'-ийг баталгаажуулах
    const targetEmail = email || req.body.recieverMail; 

    if (!targetEmail) {
      return res.status(400).json({ success: false, error: 'И-мэйл хаяг шаардлагатай' });
    }
    if (!org_id || !operator_id || !deal_id) {
      return res.status(400).json({ success: false, error: 'org_id, operator_id, deal_id мэдээллүүд шаардлагатай' });
    }

    const subject = `Нэхэмжлэх №${invoice_id}`;
    const content = `Сайн байна уу, ${customer_name}!\n\n${period || ''} тооцооны хугацааны ${Number(total_amount).toLocaleString('mn-MN')}₮ дүнтэй нэхэмжлэл амжилттай үүслээ.`;

    // ХОЛБООСНЫ ЗАСВАР: Гадны API-ийн шаардлагад нийцүүлэн 'recieverMail' түлхүүрийг зөв оноов.
    const mailRes = await fetch('https://helpy.mn/api/social/send-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject,
        content: content,
        recieverMail: targetEmail, // Энд 'recieverMail' форматаар яг очно.
        org_id: Number(org_id),
        operator_id: Number(operator_id),
        deal_id: Number(deal_id)
      })
    });

    const mailData = await mailRes.json().catch(() => ({}));

    if (!mailRes.ok) {
      return res.status(mailRes.status).json({
        success: false,
        error: mailData.error || mailData.message || 'helpy.mn сервер имэйлийг хүлээж авсангүй.'
      });
    }

    res.json({ success: true, message: 'Имэйл амжилттай илгээгдлээ', data: mailData });
  } catch (err) {
    console.error('send-invoice-email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;