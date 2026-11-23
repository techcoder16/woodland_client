// Landlord invoice for a maintenance job — built in the browser with jsPDF
// (same branding as the transaction exports). Shows ONLY the chargeable amount
// (totalCharged = contractor cost + other cost + Woodland markup). The
// contractor's cost, their invoice and the markup are never printed here.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.png";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";

const money = (n?: number | null) => `£${Number(n ?? 0).toFixed(2)}`;

export const invoiceRef = (job: JobType) => `INV-${String(job.id || "").slice(-8).toUpperCase()}`;

// jspdf-autotable records the bottom of the last table it drew on the doc.
type DocWithTable = jsPDF & { lastAutoTable?: { finalY?: number } };
const lastTableY = (doc: jsPDF) => (doc as DocWithTable).lastAutoTable?.finalY;

export function buildMaintenanceInvoice(job: JobType): jsPDF {
  const doc = new jsPDF();
  const vendor = job.property?.vendor;
  const address = [job.property?.addressLine1, job.property?.addressLine2, job.property?.town, job.property?.postCode]
    .filter(Boolean)
    .join(", ");
  // Only the landlord-facing total; never fall back to the contractor cost.
  const chargeable = job.totalCharged ?? 0;

  doc.addImage(logo, "PNG", 14, 10, 40, 16);
  doc.setFontSize(16);
  doc.text("Invoice", 196, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(invoiceRef(job), 196, 24, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 196, 29, { align: "right" });
  doc.setTextColor(0);

  doc.setFontSize(10);
  doc.text("Bill to", 14, 42);
  doc.setFontSize(9);
  const billTo = [
    [vendor?.firstName, vendor?.lastName].filter(Boolean).join(" ") || "Landlord",
    vendor?.email,
    vendor?.phone,
  ].filter(Boolean) as string[];
  billTo.forEach((line, i) => doc.text(line, 14, 48 + i * 5));

  autoTable(doc, {
    startY: 48 + billTo.length * 5 + 6,
    body: [
      ["Property", address || "-"],
      ["Job", job.jobType || "-"],
      ["Description", job.description || "-"],
      ["Contractor", job.contractorRef?.name || "-"],
      ["Completed", job.dateDone || "-"],
    ],
    theme: "plain",
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 35 } },
  });

  const startY = (lastTableY(doc) || 90) + 6;
  autoTable(doc, {
    startY,
    head: [["Item", "Amount"]],
    body: [[`${job.jobType || "Maintenance"}${job.description ? ` — ${job.description}` : ""}`, money(chargeable)]],
    foot: [["Total due", money(chargeable)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [17, 24, 39] },
    footStyles: { fillColor: [243, 244, 246], textColor: 0, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", cellWidth: 40 } },
  });

  const footerY = (lastTableY(doc) || 120) + 14;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Managed by Woodland Properties Management Ltd.", 14, footerY);
  doc.text("Please do not reply to this email or invoice.", 14, footerY + 5);
  doc.setTextColor(0);

  return doc;
}

export function downloadMaintenanceInvoice(doc: jsPDF, job: JobType) {
  doc.save(`${invoiceRef(job)}.pdf`);
}

export function invoiceToBase64(doc: jsPDF): string {
  // "data:application/pdf;filename=generated.pdf;base64,...." → raw base64
  return doc.output("datauristring").split(",")[1];
}

export function invoiceToBlob(doc: jsPDF): Blob {
  return doc.output("blob");
}
