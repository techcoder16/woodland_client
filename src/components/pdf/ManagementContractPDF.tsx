import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logo from "../../assets/logo.png";

const BLUE = "#003366";
const RED = "#dc0032";

const styles = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9, color: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  logo: { width: 110, height: 38 },
  companyInfo: { textAlign: "right", lineHeight: 1.5, fontSize: 8 },
  companyName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: RED, marginBottom: 2 },
  companyLine: { borderBottomWidth: 0.75, borderBottomColor: RED, marginBottom: 2 },
  title: { textAlign: "center", fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 18, letterSpacing: 1 },
  fieldRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 9, borderBottomWidth: 0.5, borderBottomColor: "#555", paddingBottom: 2 },
  fieldLabel: { width: 160, fontSize: 9, color: BLUE, fontFamily: "Helvetica-Bold" },
  fieldValue: { flex: 1, fontSize: 9 },
  spacer: { height: 14 },
  sigRow: { flexDirection: "row", marginTop: 26 },
  sigCol: { flex: 1 },
  sigLabel: { fontSize: 9, color: BLUE, fontFamily: "Helvetica-Bold", marginBottom: 18 },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: "#000", marginBottom: 4 },
  sigSub: { fontSize: 8 },
  sigGap: { height: 18 },
  footer: { position: "absolute", bottom: 20, right: 40, fontSize: 8, color: "#888" },
});

const Field = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || ""}</Text>
  </View>
);

const SigCol = ({ title, sub }: { title: string; sub: string }) => (
  <View style={styles.sigCol}>
    <Text style={styles.sigLabel}>{title}</Text>
    <View style={styles.sigLine} />
    <Text style={styles.sigSub}>{sub}</Text>
    <View style={styles.sigGap} />
    <Text style={styles.sigLabel}>NAME:</Text>
    <View style={styles.sigLine} />
    <View style={styles.sigGap} />
    <Text style={styles.sigLabel}>DATE:</Text>
    <View style={styles.sigLine} />
  </View>
);

const ManagementContractPDF = ({ data, property, landlord: landlordProp }: { data: any; property?: any; landlord?: any }) => {
  const landlord = landlordProp || property?.parties?.find((p: any) => p.role === "LANDLORD")?.party ||
                   property?.landlords?.[0] || {};
  const landlordName = [landlord.title, landlord.firstName || landlord.FirstName, landlord.lastName || landlord.SureName]
    .filter(Boolean).join(" ");
  const landlordPhone = landlord.phone || landlord.Phone || landlord.phoneNumber || "";
  const landlordAddress = [landlord.Address || landlord.addressLine1, landlord.town || landlord.Town]
    .filter(Boolean).join(", ");
  const propertyAddress = [
    property?.addressLine1 || property?.DoorNumber || "",
    property?.Road || "",
    property?.town || property?.towns || "",
  ].filter(Boolean).join(", ");
  const accountNo = property?.propertyNo || (property?.propertyNumber != null ? String(property.propertyNumber) : "");

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-GB") : "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>WOODLAND</Text>
            <View style={styles.companyLine} />
            <Text>235 Cranbrook Road, Ilford, Essex IG1 4TD</Text>
            <Text>Tel: 0208 554 55440  Fax: 020 8554 4433</Text>
            <Text>ig1@woodlandltd.co.uk</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>MANAGEMENT CONTRACT</Text>

        {/* Fields */}
        <Field label="Date of Agreement:" value={fmt(data.DateofAgreement)} />
        <Field label="Landlord:" value={landlordName} />
        <Field label="Phone:" value={landlordPhone} />
        <Field label="Address:" value={landlordAddress} />
        <Field label="Property To Let:" value={propertyAddress} />

        <View style={styles.spacer} />

        <Field label="Rent Required:" value={data.ManagementFees ? `£${data.ManagementFees}` : ""} />
        <Field label="Management Fee:" value={data.ManagementFees ? `${data.ManagementFees}%` : ""} />
        <Field label="Payment Arrangement:" value={fmt(data.PaymentAgreement)} />
        <Field label="Cheque Payable to:" value={data.checkPayableTo} />
        <Field label="Payment Frequency:" value={data.Frequency} />
        <Field label="Agreement Start Date:" value={fmt(data.AgreementStart)} />
        <Field label="Agreement End Date:" value={fmt(data.AgreementEnd)} />
        <Field label="Inventory Preparation Charges:" value={data.InventoryCharges ? `£${data.InventoryCharges}` : ""} />

        <View style={styles.spacer} />

        {/* Signatures */}
        <View style={styles.sigRow}>
          <SigCol title="SIGNED:" sub="(For and behalf of Landlord)" />
          <View style={{ width: 24 }} />
          <SigCol title="SIGNED:" sub="(For and behalf of Managing Agent)" />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>1 of 1</Text>
        <Text style={[styles.footer, { left: 40, right: undefined }]}>{accountNo}</Text>
      </Page>
    </Document>
  );
};

export default ManagementContractPDF;
