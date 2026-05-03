import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logo from "../../assets/logo.png";

const RED = "#dc0032";
const NAVY = "#003366";
const ORANGE = "#cc4400";

// ─── Section 21 Notice ───────────────────────────────────────────────────────

const s21 = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 50, paddingHorizontal: 50, fontFamily: "Helvetica", fontSize: 9, color: "#000" },
  h1: { textAlign: "center", fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { textAlign: "center", fontSize: 10, marginBottom: 6 },
  sub: { textAlign: "center", fontSize: 9, color: ORANGE, marginBottom: 2 },
  subSm: { textAlign: "center", fontSize: 9, color: ORANGE, marginBottom: 14 },
  row: { flexDirection: "row", marginBottom: 16 },
  lbl: { width: 40, fontSize: 9 },
  block: { flex: 1 },
  boldLine: { fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "center", marginBottom: 16 },
  afterRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  afterLbl: { width: 60, fontSize: 9 },
  afterLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#000", paddingBottom: 1 },
  sigRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  sigLbl: { flex: 1, fontSize: 9 },
  sigLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#000" },
  sigName: { textAlign: "center", fontSize: 8, marginTop: 2 },
  notesTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4, marginTop: 12 },
  noteText: { fontSize: 8, marginBottom: 6, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 20, right: 50, fontSize: 8, color: "#888" },
  footerLeft: { position: "absolute", bottom: 20, left: 50, fontSize: 8, color: "#888" },
});

export const Section21NoticePDF = ({ data, property }: { data: any; property?: any }) => {
  const tenant = property?.parties?.find((p: any) => p.role === "TENANT")?.party ||
                 property?.tenants?.[0] || {};
  const landlord = property?.parties?.find((p: any) => p.role === "LANDLORD")?.party ||
                   property?.landlords?.[0] || {};
  const tenantName = [tenant.title, tenant.firstName || tenant.FirstName, tenant.lastName || tenant.SureName]
    .filter(Boolean).join(" ") || data.tenantName || "";
  const landlordName = [landlord.title, landlord.firstName || landlord.FirstName, landlord.lastName || landlord.SureName]
    .filter(Boolean).join(" ") || data.landlordName || "";
  const propertyAddress = [
    property?.addressLine1 || property?.DoorNumber || "",
    property?.Road || "",
    property?.town || property?.towns || "",
    property?.postCode || "",
  ].filter(Boolean).join(" ");
  const landlordAddress = [landlord.Address || landlord.addressLine1, landlord.Town || landlord.town]
    .filter(Boolean).join(", ");
  const tenantAddress = propertyAddress;
  const accountNo = property?.propertyNo || property?.propertyNumber || "";

  return (
    <Document>
      <Page size="A4" style={s21.page}>
        <Text style={s21.h1}>HOUSING ACT 1988</Text>
        <Text style={s21.h2}>Section 21 (1) (b)</Text>
        <Text style={s21.sub}>ASSURED SHORTHOLD TENANCY: NOTICE REQUIRING POSSESSION</Text>
        <Text style={s21.subSm}>Fixed Term Tenancy</Text>

        <View style={s21.row}>
          <Text style={s21.lbl}>To</Text>
          <View style={s21.block}>
            <Text>{tenantName}</Text>
            <Text style={{ marginTop: 6 }}>{tenantAddress}</Text>
          </View>
        </View>

        <View style={s21.row}>
          <Text style={s21.lbl}>From</Text>
          <View style={s21.block}>
            <Text>{landlordName}</Text>
            <Text style={{ marginTop: 6 }}>{landlordAddress}</Text>
          </View>
        </View>

        <Text style={{ marginBottom: 12, fontSize: 9 }}>
          I/we give you notice that I/we require possession of the dwelling known as:
        </Text>
        <Text style={s21.boldLine}>{propertyAddress}</Text>

        <View style={s21.afterRow}>
          <Text style={s21.afterLbl}>After</Text>
          <Text style={s21.afterLine}> </Text>
        </View>
        <View style={s21.afterRow}>
          <Text style={s21.afterLbl}>Dated</Text>
          <Text style={s21.afterLine}> </Text>
        </View>

        <View style={{ height: 10 }} />
        <View style={s21.sigRow}>
          <Text style={s21.sigLbl}>SIGNED by the Landlord/Agent</Text>
          <View style={s21.sigLine} />
        </View>
        <Text style={s21.sigName}>( {landlordName} )</Text>

        <View style={{ height: 10 }} />
        <View style={s21.sigRow}>
          <Text style={s21.sigLbl}>SIGNED by the Tenant</Text>
          <View style={s21.sigLine} />
        </View>
        <Text style={s21.sigName}>( {tenantName} )</Text>

        <View style={{ height: 10 }} />
        <View style={s21.sigRow}>
          <Text style={s21.sigLbl}>SIGNED by the Witness</Text>
          <View style={s21.sigLine} />
        </View>

        <Text style={s21.notesTitle}>Notes</Text>
        <Text style={s21.noteText}>1. On or after the coming to an end of a fixed term assured shorthold tenancy, a court must make an order for possession if the landlord has given a notice in this form.</Text>
        <Text style={s21.noteText}>2. Where there are joint landlords, at least one of them must give this notice.</Text>
        <Text style={s21.noteText}>3. The length of the notice must be at least two months and the notice may be given before or on the day on which the fixed term comes to an end.</Text>

        <Text style={s21.footerLeft}>Account No: {accountNo}</Text>
        <Text style={s21.footer}>1</Text>
      </Page>
    </Document>
  );
};

// ─── Full Tenancy Agreement ───────────────────────────────────────────────────

const ta = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 50, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 9, color: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  logo: { width: 100, height: 35 },
  companyInfo: { textAlign: "right", lineHeight: 1.5, fontSize: 7.5 },
  companyName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: RED, marginBottom: 2 },
  companyLine: { borderBottomWidth: 0.75, borderBottomColor: RED, marginBottom: 2 },
  title: { textAlign: "center", fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { textAlign: "center", fontSize: 8, marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 10 },
  rowLabel: { width: 110, fontSize: 9, fontFamily: "Helvetica-Bold" },
  rowValue: { flex: 1, fontSize: 9 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#ccc", marginVertical: 12 },
  sigRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14 },
  sigLabel: { flex: 1, fontSize: 9 },
  sigLine: { flex: 2, borderBottomWidth: 0.5, borderBottomColor: "#000" },
  sigName: { textAlign: "center", fontSize: 8, marginTop: 2 },
  footer: { position: "absolute", bottom: 20, right: 44, fontSize: 7.5, color: "#888" },
  footerLeft: { position: "absolute", bottom: 20, left: 44, fontSize: 7.5, color: "#888" },
  footerCenter: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7.5, color: "#888" },
});

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={ta.row}>
    <Text style={ta.rowLabel}>{label}</Text>
    <View style={ta.rowValue}>{children}</View>
  </View>
);

export const TenancyAgreementPDF = ({ data, property, rentData }: { data: any; property?: any; rentData?: any }) => {
  const tenant = property?.parties?.find((p: any) => p.role === "TENANT")?.party ||
                 property?.tenants?.[0] || {};
  const landlord = property?.parties?.find((p: any) => p.role === "LANDLORD")?.party ||
                   property?.landlords?.[0] || {};
  const tenantName = [tenant.title, tenant.firstName || tenant.FirstName, tenant.lastName || tenant.SureName]
    .filter(Boolean).join(" ") || "";
  const landlordName = [landlord.title, landlord.firstName || landlord.FirstName, landlord.lastName || landlord.SureName]
    .filter(Boolean).join(" ") || "";
  const landlordAddress = [landlord.Address || landlord.addressLine1, landlord.Town || landlord.town, landlord.postCode]
    .filter(Boolean).join("\n");
  const propertyAddress = [
    property?.addressLine1 || property?.DoorNumber || "",
    property?.Road || "",
    property?.town || property?.towns || "",
    property?.postCode || "",
  ].filter(Boolean).join(" ");
  const accountNo = property?.propertyNo || property?.propertyNumber || "";

  const housingActText = data.housingAct === "act1"
    ? "For Letting furnished dwelling house on an assured shorthold tenancy under Part 1 of the Housing Act 1988 amended in 1996"
    : data.housingAct === "act2"
    ? "For Letting un-furnished dwelling house on an assured shorthold tenancy under Part 1 of the Housing Act 1988 amended in 1996"
    : "";

  const depositDeposits: any[] = Array.isArray(rentData?.Deposit) ? rentData.Deposit : [];
  const primaryDeposit = depositDeposits[0] || {};
  const rentAmount = rentData?.Amount || "";
  const depositAmount = primaryDeposit.rent || "";
  const termWeeks = primaryDeposit.month ? `${primaryDeposit.month} Weeks` : "";
  const startDate = primaryDeposit.startsOn ? new Date(primaryDeposit.startsOn).toLocaleDateString("en-GB") : "";
  const endDate = primaryDeposit.closedOn ? new Date(primaryDeposit.closedOn).toLocaleDateString("en-GB") : "";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <Document>
      <Page size="A4" style={ta.page}>
        {/* Header */}
        <View style={ta.header}>
          <Image src={logo} style={ta.logo} />
          <View style={ta.companyInfo}>
            <Text style={ta.companyName}>WOODLAND</Text>
            <View style={ta.companyLine} />
            <Text>235 Cranbrook Road, Ilford, Essex IG1 4TD</Text>
            <Text>Tel: 0208 554 55440  Fax: 020 8554 4433</Text>
            <Text>ig1@woodlandltd.co.uk</Text>
          </View>
        </View>

        <Text style={ta.title}>TENANCY AGREEMENT</Text>
        {housingActText ? <Text style={ta.subtitle}>{housingActText}</Text> : null}

        <Row label="DATE:"><Text>{today}</Text></Row>
        <Row label="The Landlord:">
          <Text>{landlordName}</Text>
          {landlordAddress ? <Text style={{ marginTop: 2 }}>{landlordAddress}</Text> : null}
        </Row>
        <Row label="The Tenant:"><Text>{tenantName}</Text></Row>
        <Row label="The Agent:">
          <Text>Woodland</Text>
          <Text>235 Cranbrook Road, Ilford, Essex IG1 4TD</Text>
        </Row>
        <Row label="The Guarantor:"><Text>{data.Guaranteer || ""}</Text></Row>
        <Row label="The Property:">
          <Text>{propertyAddress}</Text>
          <Text style={{ marginTop: 2, fontSize: 8 }}>
            Together with the Fixtures, Furniture and Effect therein and more particularly specified in the Inventory thereof signed by the parties
          </Text>
        </Row>
        <Row label="The Term:"><Text>A term certain of {termWeeks}</Text></Row>
        <Row label=""><Text>From:  {startDate}</Text></Row>
        <Row label=""><Text>To:    {endDate}</Text></Row>
        <Row label="The Rent:"><Text>£{rentAmount} per.</Text></Row>
        <Row label="Payable:">
          <Text>Security Deposit:   {depositAmount ? `£${depositAmount}` : "Nil"}</Text>
          <Text>Rent ( in Advance):</Text>
        </Row>
        <Row label="The Deposit Held by:"><Text>{rentData?.HoldBy || ""}</Text></Row>
        <Row label="The Payment Date:">
          <Text>The first payment to be made on .   All subsequent payments to be made  ly in advance.</Text>
        </Row>

        <View style={ta.divider} />

        {/* Signatures */}
        <View style={ta.sigRow}>
          <Text style={ta.sigLabel}>SIGNED by the Landlord/Agent</Text>
          <View style={ta.sigLine} />
        </View>
        <Text style={ta.sigName}>( {landlordName} ) / ( WOODLAND )</Text>

        <View style={{ height: 8 }} />
        <View style={ta.sigRow}>
          <Text style={ta.sigLabel}>SIGNED by the Tenant</Text>
          <View style={ta.sigLine} />
        </View>
        <Text style={ta.sigName}>( {tenantName} )</Text>

        <View style={{ height: 8 }} />
        <View style={ta.sigRow}>
          <Text style={ta.sigLabel}>SIGNED by the Guarantor</Text>
          <View style={ta.sigLine} />
        </View>
        <Text style={ta.sigName}>( {data.Guaranteer || ""} )</Text>

        <View style={{ height: 8 }} />
        <View style={ta.sigRow}>
          <Text style={ta.sigLabel}>SIGNED by the Witness</Text>
          <View style={ta.sigLine} />
        </View>
        <Text style={ta.sigName}>( {data.witness || ""} )</Text>

        {/* Footer */}
        <Text style={ta.footerLeft}>Ref: {accountNo}   Landlord (Initials): ____________   Tenant (Initials): ____________</Text>
        <Text style={ta.footer}>Page: 1</Text>
      </Page>
    </Document>
  );
};
