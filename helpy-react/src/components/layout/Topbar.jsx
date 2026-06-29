import React from 'react';
import { useLocation } from 'react-router-dom';
import { ORG_CONFIG } from '../../config/orgConfig'; 

const PAGE_TITLES = {
  '/': 'Хяналтын самбар',
  '/invoices': 'Нэхэмжлэл',
  '/create-invoice': 'Нэхэмжлэх үүсгэх', // 🔴 ЭНЭ МӨРИЙГ НЭМСЭН
  '/summary': 'Нийт хураангуй',
};

export default function Topbar({ onRefresh }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'Helpy';

  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-right">
        
        {/* ── Зөвхөн тухайн нэг байгууллагыг харуулах Static Badge ── */}
        <div 
          className="badge" 
          style={{ 
            background: 'var(--helpy-soft)', 
            color: 'var(--helpy-blue)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <i className="ti ti-building-hospital" style={{ fontSize: '16px' }} />
          {ORG_CONFIG.NAME}
        </div>

        {/* Шинэчлэх товчлуур хэвээр үлдсэн */}
        <div className="btn-icon" onClick={onRefresh} title="Шинэчлэх">
          <i className="ti ti-refresh" />
        </div>
        
      </div>
    </div>
  );
}