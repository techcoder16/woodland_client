import { LOGO_BASE64 } from "./logoBase64";

interface MaintenanceInvoiceData {
  jobId: string;
  jobType: string;
  description?: string;
  dueDate?: string;
  dateDone?: string;
  totalCharged?: number | null;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
  landlordName?: string;
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function generateMaintenanceInvoicePdf(data: MaintenanceInvoiceData) {
  const win = window.open("", "_blank");
  if (!win) return;

  const propertyAddress = [data.addressLine1, data.addressLine2, data.town, data.postCode]
    .filter(Boolean)
    .join(", ");

  const invoiceNumber = `INV-${data.jobId.slice(-8).toUpperCase()}`;
  const amount = data.totalCharged != null ? `£${data.totalCharged.toFixed(2)}` : "";

  win.document.write(`
    <html>
      <head>
        <title>Maintenance Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; font-size: 14px; color: #10131A; }
          .logo { margin-bottom: 24px; }
          .logo img { max-width: 320px; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          td, th { border: 1px solid #000; padding: 10px; vertical-align: top; }
          td.label { width: 30%; font-weight: bold; background: #f5f5f5; }
          .amount-row td { font-size: 16px; font-weight: bold; }
          .section { margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="logo"><img src="${LOGO_BASE64}" alt="Woodland" /></div>
        <h1>MAINTENANCE INVOICE</h1>
        <table>
          <tr><td class="label">Invoice Number</td><td>${invoiceNumber}</td></tr>
          <tr><td class="label">Billed To</td><td>${data.landlordName || ""}</td></tr>
          <tr><td class="label">Property</td><td>${propertyAddress || ""}</td></tr>
          <tr><td class="label">Job Type</td><td>${data.jobType || ""}</td></tr>
          <tr><td class="label">Description</td><td>${data.description || ""}</td></tr>
          <tr><td class="label">Reported</td><td>${formatDate(data.dueDate)}</td></tr>
          <tr><td class="label">Completed</td><td>${formatDate(data.dateDone)}</td></tr>
          <tr class="amount-row"><td class="label">Amount Due</td><td>${amount}</td></tr>
        </table>

        <div class="section">
          Managed by Woodland Properties Management Ltd.
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}
