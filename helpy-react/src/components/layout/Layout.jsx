import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  // Дэд хуудас бүр өөрийнхөө "refresh" логикийг window event-ээр дамжуулж болно,
  // эсвэл context-аар дамжуулсан refreshKey ашиглаж болно. Энгийн байдлаар
  // browser-ийн location reload-той төстэй full re-fetch хийхийн тулд
  // CustomEvent ашиглая — энгийн, dependency шаардахгүй арга.
  function handleRefresh() {
    window.dispatchEvent(new CustomEvent('helpy:refresh'));
  }

  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar onRefresh={handleRefresh} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
