// PDF receipt/report for one incoming payment — the "Download PDF" button on
// the Incoming Payments view dialog and the wizard's confirmation screen.
// Same branded header as the landlord payment exports (transactionExport.ts).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.png";
import { formatPropertyReference } from "./propertyReference";
import { formatPeriod, IncomingPayment } from "@/pages/Finance/incomingPaymentShared";

const amount = (value: unknown) =>
  `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYER_LABEL: Record<string, string> = { INDIVIDUAL: "Individual tenant", COMPANY: "Company (bulk)", COUNCIL: "Council (bulk)" };

export function exportIncomingPaymentToPdf(payment: IncomingPayment) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.addImage(logo, "PNG", 14, 10, 40, 16);
  doc.setFontSize(14);
  doc.text("Incoming Payment Report", 60, 17);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Reference ${payment.reference}`, 60, 23);
  doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, 60, 28);
  doc.setTextColor(0);

  // Amount callout, top right
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Amount received", pageWidth - 14, 17, { align: "right" });
  doc.setFontSize(16);
  doc.setTextColor(4, 120, 87);
  doc.text(amount(payment.amount), pageWidth - 14, 25, { align: "right" });
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 36,
    body: [
      ["Payer", payment.payerName],
      ["Payer type", PAYER_LABEL[payment.payerKind] || payment.payerKind],
      ["Payment date", new Date(payment.paymentDate).toLocaleDateString("en-GB")],
      ["Payment method", payment.paymentMethod],
      ["Payment reference", payment.paymentReference || "-"],
      ["Recorded by", payment.createdByName || "-"],
      ...(payment.notes ? [["Notes", payment.notes]] : []),
    ],
    theme: "plain",
    styles: { fontSize: 9 },
    columnStyles: { 0: { textColor: 110, cellWidth: 45 }, 1: { fontStyle: "bold" } },
  });

  const allocated = payment.allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY || 36) + 6,
    head: [["#", "Property", "Occupancy", "Tenant", "Period", "Amount"]],
    body: payment.allocations.map((a, i) => [
      String(i + 1),
      `${formatPropertyReference(a.property?.propertyNumber)} · ${a.property?.addressLine1 || "-"}${a.property?.postCode ? `, ${a.property.postCode}` : ""}`,
      a.occupancy?.reference || "-",
      [a.occupancy?.occupier?.FirstName, a.occupancy?.occupier?.SureName].filter(Boolean).join(" ") || "-",
      formatPeriod(a.period),
      amount(a.amount),
    ]),
    foot: [["", "", "", "", "Total allocated", amount(allocated)]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [17, 24, 39] },
    footStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 8 }, 5: { halign: "right" } },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 60;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Allocations count towards each occupancy's rent for the period shown.", 14, finalY + 8);

  doc.save(`incoming-payment-${payment.reference}.pdf`);
}
