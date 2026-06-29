
function getHtml2Pdf() {
  if (typeof window !== 'undefined' && window.html2pdf) return window.html2pdf;
  throw new Error('html2pdf.js ачаалагдаагүй байна. index.html дотор script tag-аа шалгаарай.');
}

export async function downloadInvoicePdf(element, filename) {
  if (!element) throw new Error('PDF татах элемент олдсонгүй');

  const html2pdf = getHtml2Pdf();

  const opt = {
    margin: [15, 15, 15, 15],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  await html2pdf().set(opt).from(element).save();
}
