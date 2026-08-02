import { LOGO_BASE64 } from "./logoBase64";

interface RentalAgreementData {
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
  rentEffectiveDate?: string;
  rentPerMonth?: string;
  rentPayableInAdvance?: string;
  rentalTerms?: string;
  vendorName?: string;
}

const ADVANCE_LABELS: Record<string, string> = {
  "1_week": "1 Week",
  "1_month": "1 Month",
  "6_months": "6 Months",
  "1_year": "1 Year",
};

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function generateRentalAgreementPdf(data: RentalAgreementData) {
  const win = window.open("", "_blank");
  if (!win) return;

  const propertyAddress = [data.addressLine1, data.addressLine2, data.town, data.postCode]
    .filter(Boolean)
    .join(", ");

  win.document.write(`
    <html>
      <head>
        <title>Rental Agreement</title>
        <style>
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
        </style>
      </head>
      <body>
        <div class="logo"><img src="${LOGO_BASE64}" alt="Woodland" /></div>
        <h1>LEASE / RENTAL AGREEMENT</h1>
        <table>
          <tr><td class="label">Property</td><td>${propertyAddress || ""}</td></tr>
          <tr><td class="label">Rent Effective Date</td><td>${formatDate(data.rentEffectiveDate)}</td></tr>
          <tr><td class="label">Parties to the Lease</td><td>
            Lessor:<br/><br/>
            Lessee:<br/>
            Woodland Properties Management Ltd<br/>
            ${data.vendorName ? `<br/>Landlord: ${data.vendorName}` : ""}
          </td></tr>
          <tr><td class="label">Rent Per Month</td><td>${data.rentPerMonth ? "£" + data.rentPerMonth : ""} per calendar month</td></tr>
          <tr><td class="label">Rent Payable In Advance</td><td>${data.rentPayableInAdvance ? (ADVANCE_LABELS[data.rentPayableInAdvance] || data.rentPayableInAdvance) : ""}</td></tr>
        </table>

        <div class="section">
          <div class="label" style="font-weight:bold;margin-bottom:8px">Terms</div>
          <div class="terms">${data.rentalTerms || ""}</div>
        </div>

        <div class="sign">
          <div><p>Signed (Lessor)</p></div>
          <div><p>Signed (Lessee) — Woodland Properties Management Ltd</p></div>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
}
