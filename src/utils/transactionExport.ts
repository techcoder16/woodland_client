// Excel (.xlsx) and PDF export for landlord transaction lists — used by the
// Landlord Payments page "Export" button. Both formats carry the Woodland
// logo so exported files are recognizably branded.
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.png";
import { formatPropertyReference } from "./propertyReference";

export type ExportablePayment = {
  id: string;
  toLandlordPaidBy?: string;
  toLandlordDate?: string;
  status?: string;
  toLandlordRentReceived?: number;
  toLandlordLessBuildingExpenditure?: number;
  toLandlordLessVAT?: number;
  toLandlordLessManagementFees?: number;
  toLandlordNetPaid?: number;
  toLandlordNetReceived?: number;
  propertyId?: string;
};

type PropertyLookup = Map<string, { addressLine1?: string; propertyNumber?: number }>;

const money = (value: unknown) => Number(value || 0).toFixed(2);
const amountOf = (p: ExportablePayment) => Number(p.toLandlordNetPaid ?? p.toLandlordNetReceived ?? p.toLandlordRentReceived ?? 0);

function toRows(payments: ExportablePayment[], properties: PropertyLookup) {
  return payments.map((payment) => {
    const property = properties.get(payment.propertyId || "");
    const adjustment =
      Number(payment.toLandlordLessBuildingExpenditure || 0) +
      Number(payment.toLandlordLessVAT || 0) +
      Number(payment.toLandlordLessManagementFees || 0);
    return {
      Date: payment.toLandlordDate ? new Date(payment.toLandlordDate).toLocaleDateString("en-GB") : "",
      Landlord: payment.toLandlordPaidBy || "",
      Property: formatPropertyReference(property?.propertyNumber),
      Address: property?.addressLine1 || "",
      Status: payment.status || "",
      "Contractual (£)": money(payment.toLandlordRentReceived),
      "Adjustments (£)": money(adjustment),
      "Net Payable (£)": money(amountOf(payment)),
    };
  });
}

export function exportTransactionsToExcel(payments: ExportablePayment[], properties: PropertyLookup, filename = "woodland-landlord-payments.xlsx") {
  const rows = toRows(payments, properties);
  const worksheet = XLSX.utils.json_to_sheet(rows, { origin: "A3" });

  // Branded header: company name in row 1 (logo itself isn't embeddable in a
  // plain XLSX sheet without a much heavier writer, so the header row is the
  // practical way to carry the Woodland identity into the spreadsheet).
  XLSX.utils.sheet_add_aoa(worksheet, [["Woodland Property Management"], ["Landlord Payments Export"]], { origin: "A1" });
  worksheet["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Landlord Payments");
  XLSX.writeFile(workbook, filename);
}

export function exportTransactionsToPdf(payments: ExportablePayment[], properties: PropertyLookup, filename = "woodland-landlord-payments.pdf") {
  const doc = new jsPDF({ orientation: "landscape" });

  // Logo + title header
  doc.addImage(logo, "PNG", 14, 10, 40, 16);
  doc.setFontSize(14);
  doc.text("Landlord Payments", 60, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, 60, 24);
  doc.setTextColor(0);

  const rows = toRows(payments, properties);
  autoTable(doc, {
    startY: 32,
    head: [Object.keys(rows[0] || { Date: "", Landlord: "", Property: "", Address: "", Status: "", "Contractual (£)": "", "Adjustments (£)": "", "Net Payable (£)": "" })],
    body: rows.map((row) => Object.values(row)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [17, 24, 39] },
  });

  const totalPayable = payments.reduce((sum, p) => sum + amountOf(p), 0);
  const finalY = (doc as any).lastAutoTable?.finalY || 32;
  doc.setFontSize(10);
  doc.text(`Total net payable: £${money(totalPayable)}`, 14, finalY + 10);

  doc.save(filename);
}

// One landlord payment's Review & Confirm summary as a PDF — the
// New Landlord Payment page's "Download PDF" button, before it is saved.
export type PaymentReview = {
  details: [string, string][];
  adjustments: { type: string; description?: string; relatedTo?: string; amount: number }[];
  contractualRent: number;
  adjustmentTotal: number;
  netPayable: number;
};

export function exportPaymentReviewToPdf(review: PaymentReview, filename = "woodland-landlord-payment.pdf") {
  const doc = new jsPDF();

  doc.addImage(logo, "PNG", 14, 10, 40, 16);
  doc.setFontSize(14);
  doc.text("Landlord Payment — Review", 60, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, 60, 24);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 32,
    body: review.details,
    theme: "plain",
    styles: { fontSize: 9 },
    columnStyles: { 0: { textColor: 110, cellWidth: 50 }, 1: { fontStyle: "bold" } },
  });

  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY || 32) + 6,
    head: [["Adjustment", "Description", "Related To", "Amount (£)"]],
    body: review.adjustments.length
      ? review.adjustments.map((a) => [a.type, a.description || "-", a.relatedTo || "-", money(a.amount)])
      : [["No adjustments", "", "", ""]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [17, 24, 39] },
    columnStyles: { 3: { halign: "right" } },
  });

  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY || 32) + 6,
    body: [
      ["Contractual rent", `£${money(review.contractualRent)}`],
      ["Total adjustments", `£${money(review.adjustmentTotal)}`],
      ["Net payable", `£${money(review.netPayable)}`],
    ],
    theme: "plain",
    margin: { left: 110 },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  doc.save(filename);
}
