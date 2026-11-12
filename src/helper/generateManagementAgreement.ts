import { LOGO_BASE64 } from "./logoBase64";

interface ManagementAgreementData {
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
  managementDate?: string;
  rentEffectiveDate?: string;
  rentPerMonth?: string;
  rentPayableInAdvance?: string;
  rentPayableTiming?: string;
  rentalTerms?: string;
  termMonths?: string;
  vendorName?: string;
  tenantName?: string;
}

const ADVANCE_LABELS: Record<string, string> = {
  "1_week": "1 Week",
  "1_month": "1 Month",
  "6_months": "6 Months",
  "1_year": "1 Year",
};

// Woodland's registered management address — the Lessee on every agreement.
const WOODLAND_LESSEE_ADDRESS = ["Woodland Properties Management Ltd", "Park House", "168 Stainforth Road", "Ilford", "IG2 7EL"];

const TIMING_LABELS: Record<string, string> = { advance: "In Advance", arrears: "In Arrears" };

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

const AGREEMENT_STYLE = `
  body { font-family: Arial, sans-serif; margin: 40px; font-size: 14px; color: #10131A; }
  .logo { margin-bottom: 24px; }
  .logo img { max-width: 320px; }
  h1 { text-align: center; font-size: 18px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  td, th { border: 1px solid #000; padding: 10px; vertical-align: top; }
  td.label { width: 30%; font-weight: bold; background: #f5f5f5; }
  .section { margin-top: 24px; }
  .terms { white-space: pre-wrap; line-height: 1.6; }
  .sign { display: flex; justify-content: space-between; margin-top: 60px; }
  .sign div { width: 45%; }
  .sign p { margin: 30px 0 0; border-top: 1px solid #000; padding-top: 4px; }
`;

const esc = (v?: string) => (v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function agreementBody(data: ManagementAgreementData): string {
  const propertyAddress = [data.addressLine1, data.addressLine2, data.town, data.postCode].filter(Boolean).map(esc).join(", ");
  return `
        <div class="logo"><img src="${LOGO_BASE64}" alt="Woodland" /></div>
        <h1>LEASE</h1>
        <table>
          <tr><td class="label">Property</td><td>${propertyAddress}</td></tr>
          <tr><td class="label">Management Date</td><td>${formatDate(data.managementDate)}</td></tr>
          <tr><td class="label">Rent Effective Date</td><td>${formatDate(data.rentEffectiveDate)}</td></tr>
          <tr><td class="label">Parties to the Lease</td><td>
            Lessor:${data.vendorName ? " " + esc(data.vendorName) : ""}<br/><br/>
            Lessee:<br/>
            ${WOODLAND_LESSEE_ADDRESS.join("<br/>")}
            ${data.tenantName ? `<br/><br/>Tenant: ${esc(data.tenantName)}` : ""}
          </td></tr>
          <tr><td class="label">Term</td><td>${data.termMonths ? esc(data.termMonths) + " Months" : "Months"}</td></tr>
          <tr><td class="label">Rent per month</td><td>${data.rentPerMonth ? "£" + esc(data.rentPerMonth) : "£"} per calendar month</td></tr>
          <tr><td class="label">Rent Payable</td><td>${data.rentPayableTiming ? (TIMING_LABELS[data.rentPayableTiming] || esc(data.rentPayableTiming)) : ""}</td></tr>
          <tr><td class="label">Rent Due</td><td>${data.rentPayableInAdvance ? (ADVANCE_LABELS[data.rentPayableInAdvance] || esc(data.rentPayableInAdvance)) : ""}</td></tr>
        </table>

        <div class="section">
          <div class="label" style="font-weight:bold;margin-bottom:8px">Terms</div>
          <div class="terms">${esc(data.rentalTerms)}</div>
        </div>

        <div class="sign">
          <div><p>Signed (Lessor)</p></div>
          <div><p>Signed (Lessee) — Woodland Properties Management Ltd</p></div>
        </div>`;
}

/** Opens the agreement in a print dialog (Save as PDF). */
export function generateManagementAgreementPdf(data: ManagementAgreementData) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<html><head><title>Management Agreement</title><style>${AGREEMENT_STYLE}</style></head><body>${agreementBody(data)}</body></html>`);
  win.document.close();
  win.print();
}

/** Renders the agreement to a real PDF file so it can be uploaded and stored. */
export async function buildManagementAgreementPdfFile(data: ManagementAgreementData): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;width:760px;background:#fff;";
  host.innerHTML = `<style>${AGREEMENT_STYLE.replace("body {", ".ma-root {")}</style><div class="ma-root">${agreementBody(data)}</div>`;
  document.body.appendChild(host);
  try {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    await pdf.html(host.querySelector(".ma-root") as HTMLElement, { x: 0, y: 0, width: 595, windowWidth: 800, autoPaging: "text" });
    return new File([pdf.output("blob")], "management-agreement.pdf", { type: "application/pdf" });
  } finally {
    document.body.removeChild(host);
  }
}
