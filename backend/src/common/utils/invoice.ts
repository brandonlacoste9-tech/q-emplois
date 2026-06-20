/**
 * Quebec tax invoice generator for escrow milestone releases.
 * TPS (GST): 5%, TVQ (QST): 9.975%
 */
export interface InvoiceLine {
  description: string;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clientName: string;
  providerName: string;
  lines: InvoiceLine[];
  subtotal: number;
  tpsRate: number;
  tvqRate: number;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const tps = Math.round(data.subtotal * data.tpsRate * 100) / 100;
  const tvq = Math.round(data.subtotal * data.tvqRate * 100) / 100;
  const total = Math.round((data.subtotal + tps + tvq) * 100) / 100;

  const linesHtml = data.lines
    .map((l) => `<tr><td style="padding:8px;border-bottom:1px solid #333;">${l.description}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #333;">${l.amount.toFixed(2)} $</td></tr>`)
    .join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${data.invoiceNumber}</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#1a1a1a;}
.header{border-bottom:2px solid #2d6a4f;padding-bottom:16px;margin-bottom:24px;}
h1{font-size:22px;margin:0;color:#2d6a4f;}h2{font-size:16px;margin:4px 0 0;color:#666;}
table{width:100%;border-collapse:collapse;margin:20px 0;}
.totals{margin-top:20px;text-align:right;}.totals p{margin:4px 0;}
.total{font-size:18px;font-weight:bold;color:#2d6a4f;}
.footer{margin-top:40px;font-size:12px;color:#999;border-top:1px solid #ddd;padding-top:16px;}
.qc{color:#2d6a4f;font-weight:bold;}</style></head><body>
<div class="header"><h1>Q-Emplois ⚜</h1><h2>Facture — Québec emplois</h2></div>
<p><strong>Facture n°</strong> ${data.invoiceNumber}</p>
<p><strong>Date</strong> : ${data.date}</p>
<p><strong>Client</strong> : ${data.clientName}</p>
<p><strong>Prestataire</strong> : ${data.providerName}</p>
<table><thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #2d6a4f;">Description</th><th style="text-align:right;padding:8px;border-bottom:2px solid #2d6a4f;">Montant</th></tr></thead>
<tbody>${linesHtml}</tbody></table>
<div class="totals">
<p>Sous-total : ${data.subtotal.toFixed(2)} $</p>
<p>TPS (5%) : ${tps.toFixed(2)} $</p>
<p>TVQ (9,975%) : ${tvq.toFixed(2)} $</p>
<p class="total">Total : ${total.toFixed(2)} $</p>
</div>
<div class="footer"><p>Q-Emplois — Services à domicile au Québec</p>
<p>TPS : 700000000 RT 0001 | TVQ : 1000000000 TQ 0001</p>
<p class="qc">⚜ Fait au Québec ⚜</p></div></body></html>`;
}

export function generateInvoiceNumber(contractId: string, milestoneId: string): string {
  const short = `${contractId.slice(0, 6)}-${milestoneId.slice(0, 4)}`.toUpperCase();
  return `QC-${short}`;
}