import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logo from "../../assets/logo.png";

const RED = "#dc0032";
const BLUE_BG = "#c8d8f0";

const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 36, paddingHorizontal: 28, fontFamily: "Helvetica", fontSize: 8, color: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  logo: { width: 95, height: 33 },
  companyInfo: { textAlign: "right", lineHeight: 1.5, fontSize: 7.5 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: RED, marginBottom: 2 },
  companyLine: { borderBottomWidth: 0.75, borderBottomColor: RED, marginBottom: 2 },
  title: { textAlign: "center", fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 12, letterSpacing: 1 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  infoLeft: { flex: 1 },
  infoRight: { flex: 1, alignItems: "flex-end" },
  infoLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  infoValue: { fontSize: 8 },
  propRow: { flexDirection: "row", marginBottom: 4 },
  propLabel: { width: 55, fontSize: 8, fontFamily: "Helvetica-Bold" },
  propValue: { flex: 1, fontSize: 8 },
  // Table
  tableHeader: { flexDirection: "row", backgroundColor: BLUE_BG, paddingVertical: 3, paddingHorizontal: 2 },
  tableRow: { flexDirection: "row", paddingVertical: 2, paddingHorizontal: 2, borderBottomWidth: 0.3, borderBottomColor: "#ddd" },
  tableRowAlt: { flexDirection: "row", paddingVertical: 2, paddingHorizontal: 2, backgroundColor: "#f0f4fa", borderBottomWidth: 0.3, borderBottomColor: "#ddd" },
  colTranNo:   { width: 40 },
  colDate:     { width: 55 },
  colMode:     { width: 40 },
  colNote:     { flex: 1 },
  colDebit:    { width: 55, textAlign: "right" },
  colBenefit1: { width: 55, textAlign: "right" },
  colBenefit2: { width: 55, textAlign: "right" },
  colRecv:     { width: 55, textAlign: "right" },
  thText: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  tdText: { fontSize: 7.5 },
  totalsRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 2, backgroundColor: "#e8edf5", borderTopWidth: 0.5, borderTopColor: "#555" },
  totalsLabel: { flex: 1, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  totalsValue: { width: 55, textAlign: "right", fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  creditRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 2 },
  footerLeft: { position: "absolute", bottom: 18, left: 28, fontSize: 7, color: "#888" },
  footer: { position: "absolute", bottom: 18, right: 28, fontSize: 7, color: "#888" },
});

const money = (v: any) => v != null && v !== "" && !isNaN(Number(v)) ? Number(v).toFixed(2) : "";
const fmtDate = (v: any) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

const TenantStatementPDF = ({
  transactions,
  property,
  rentData,
}: {
  transactions: any[];
  property?: any;
  rentData?: any;
}) => {
  const tenant = property?.parties?.find((p: any) => p.role === "TENANT")?.party ||
                 property?.tenants?.[0] || {};
  const tenantName = [tenant.title, tenant.firstName || tenant.FirstName, tenant.lastName || tenant.SureName]
    .filter(Boolean).join(" ") || "";
  const tenantAddress = [
    property?.addressLine1 || property?.DoorNumber || "",
    property?.Road || "",
    property?.town || property?.towns || "",
    property?.postCode || "",
  ].filter(Boolean);

  const propertyRef = [
    property?.addressLine1 || property?.DoorNumber || "",
    property?.Road || "",
    property?.town || property?.towns || "",
    property?.postCode || "",
  ].filter(Boolean).join(" ");

  const accountNo = property?.propertyNo || property?.propertyNumber || "";
  const deposits: any[] = Array.isArray(rentData?.Deposit) ? rentData.Deposit : [];
  const primaryDeposit = deposits[0] || {};
  const rentStartsOn = primaryDeposit.startsOn
    ? new Date(primaryDeposit.startsOn).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "";
  const per = primaryDeposit.per || rentData?.per || "";

  // Totals
  const totalDebit    = transactions.reduce((s, t) => s + (Number(t.fromTenantOtherDebit) || 0), 0);
  const totalBenefit1 = transactions.reduce((s, t) => s + (Number(t.fromTenantHBenefit1) || 0), 0);
  const totalBenefit2 = transactions.reduce((s, t) => s + (Number(t.fromTenantHBenefit2) || 0), 0);
  const totalRecv     = transactions.reduce((s, t) => s + (Number(t.fromTenantRentReceived) || 0), 0);
  const totalCredit   = transactions.reduce((s, t) => s + (Number(t.tenantTotalCredit) || 0), 0);

  const now = new Date();
  const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>WOODLAND</Text>
            <View style={styles.companyLine} />
            <Text>Tel: 0208 554 55440  Fax: 020 8554 4433</Text>
            <Text>ig1@woodlandltd.co.uk</Text>
          </View>
        </View>

        <Text style={styles.title}>TENANT STATEMENT</Text>

        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoValue}>{tenantName}</Text>
            {tenantAddress.map((line, i) => <Text key={i} style={styles.infoValue}>{line}</Text>)}
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.infoLabel}>Account No:   {accountNo}</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>Rent Starts on:</Text>
            <Text style={styles.infoValue}>{rentStartsOn}</Text>
          </View>
        </View>

        {/* Property row */}
        <View style={styles.propRow}>
          <Text style={styles.propLabel}>Property:</Text>
          <Text style={styles.propValue}>{propertyRef}</Text>
        </View>
        <View style={styles.propRow}>
          <Text style={styles.propLabel}>Rent:</Text>
          <Text style={styles.propValue}>{per}</Text>
        </View>

        <View style={{ height: 8 }} />

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colTranNo]}>Tran No</Text>
          <Text style={[styles.thText, styles.colDate]}>Date</Text>
          <Text style={[styles.thText, styles.colMode]}>Mode</Text>
          <Text style={[styles.thText, styles.colNote]}>Note</Text>
          <Text style={[styles.thText, styles.colDebit]}>Debit</Text>
          <Text style={[styles.thText, styles.colBenefit1]}>H.Benefit (1)</Text>
          <Text style={[styles.thText, styles.colBenefit2]}>H.Benefit (2)</Text>
          <Text style={[styles.thText, styles.colRecv]}>Received</Text>
        </View>

        {/* Rows */}
        {transactions.map((tx, i) => (
          <View key={tx.id || i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tdText, styles.colTranNo]}>{tx.tranid || tx.id || ""}</Text>
            <Text style={[styles.tdText, styles.colDate]}>{fmtDate(tx.fromTenantDate)}</Text>
            <Text style={[styles.tdText, styles.colMode]}>{tx.fromTenantMode || ""}</Text>
            <Text style={[styles.tdText, styles.colNote]}>{tx.fromTenantDescription || ""}</Text>
            <Text style={[styles.tdText, styles.colDebit]}>{money(tx.fromTenantOtherDebit)}</Text>
            <Text style={[styles.tdText, styles.colBenefit1]}>{money(tx.fromTenantHBenefit1)}</Text>
            <Text style={[styles.tdText, styles.colBenefit2]}>{money(tx.fromTenantHBenefit2)}</Text>
            <Text style={[styles.tdText, styles.colRecv]}>{money(tx.fromTenantRentReceived)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Totals:</Text>
          <Text style={styles.totalsValue}>{money(totalDebit)}</Text>
          <Text style={styles.totalsValue}>{money(totalBenefit1)}</Text>
          <Text style={styles.totalsValue}>{money(totalBenefit2)}</Text>
          <Text style={styles.totalsValue}>{money(totalRecv)}</Text>
        </View>
        <View style={styles.creditRow}>
          <Text style={[styles.totalsLabel, { textAlign: "right" }]}>Total Credit:</Text>
          <Text style={styles.totalsValue}>{money(totalCredit)}</Text>
        </View>

        <Text style={styles.footerLeft}>{timestamp}</Text>
        <Text style={styles.footer}>1 of 1</Text>
      </Page>
    </Document>
  );
};

export default TenantStatementPDF;
