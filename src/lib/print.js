import { inr2 } from './format';

/**
 * Thermal-printer friendly invoice printing.
 * Opens a print window styled for 58mm/80mm rolls. The browser print dialog
 * routes to the selected thermal printer. Falls back gracefully on any device.
 */
export function printInvoice(invoice, width = '80mm') {
  const items = invoice.items || [];
  const shop = invoice.shop || {};
  const rows = items
    .map(
      (it) => `
      <tr>
        <td class="l">${escapeHtml(it.product_name)}<br/><span class="muted">${it.quantity} x ${inr2(it.selling_price)}</span></td>
        <td class="r">${inr2(it.line_total)}</td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${invoice.invoice_number}</title>
  <style>
    @page { size: ${width} auto; margin: 0; }
    * { font-family: 'Courier New', monospace; }
    body { width: ${width}; margin: 0; padding: 6px 8px; color:#000; font-size: 12px; }
    h1 { font-size: 16px; text-align:center; margin: 2px 0; }
    .center { text-align:center; }
    .muted { color:#555; font-size: 10px; }
    table { width:100%; border-collapse: collapse; margin-top: 6px; }
    td { padding: 2px 0; vertical-align: top; }
    .l { text-align:left; } .r { text-align:right; }
    .line { border-top: 1px dashed #000; margin: 6px 0; }
    .total { font-size: 14px; font-weight: bold; }
  </style></head><body>
    <h1>${escapeHtml(shop.name || 'RK Garments')}</h1>
    <div class="center muted">
      ${escapeHtml(shop.address || '')}<br/>
      ${escapeHtml(shop.phone || '')}
      ${shop.is_gst_enabled && shop.gstin ? '<br/>GSTIN: ' + escapeHtml(shop.gstin) : ''}
    </div>
    <div class="line"></div>
    <div class="muted">
      Invoice: <b>${invoice.invoice_number}</b><br/>
      Date: ${new Date(invoice.created_at).toLocaleString('en-IN')}<br/>
      Staff: ${escapeHtml(invoice.staffName || '-')}
      ${invoice.customer?.name ? '<br/>Customer: ' + escapeHtml(invoice.customer.name) : ''}
    </div>
    <table>${rows}</table>
    <div class="line"></div>
    <table>
      <tr><td class="l">Subtotal</td><td class="r">${inr2(invoice.subtotal)}</td></tr>
      ${Number(invoice.discount) > 0 ? `<tr><td class="l">Discount</td><td class="r">-${inr2(invoice.discount)}</td></tr>` : ''}
      ${Number(invoice.tax_amount) > 0 ? `<tr><td class="l">Tax (${invoice.tax_pct}%)</td><td class="r">${inr2(invoice.tax_amount)}</td></tr>` : ''}
      <tr class="total"><td class="l">TOTAL</td><td class="r">${inr2(invoice.total)}</td></tr>
      <tr><td class="l">Payment</td><td class="r">${String(invoice.payment_mode).toUpperCase()}</td></tr>
    </table>
    <div class="line"></div>
    <div class="center muted">${escapeHtml(shop?.settings?.invoice?.footer || 'Thank you for shopping with us!')}</div>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close();},300);};</script>
  </body></html>`;

  const w = window.open('', '_blank', 'width=380,height=600');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
