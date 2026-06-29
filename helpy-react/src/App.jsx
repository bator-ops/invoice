import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import Summary from './pages/Summary';
import CreateInvoice from './pages/CreateInvoice';
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        {/* AuthProvider болон OrgSelectScreen-ийг устгаж, шууд Layout руу ордог боллоо */}
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="create-invoice" element={<CreateInvoice />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}