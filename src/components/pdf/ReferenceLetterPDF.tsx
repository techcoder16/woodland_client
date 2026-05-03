import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logo from "../../assets/logo.png";

const RED = "#dc0032";

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 60, paddingHorizontal: 50, fontFamily: "Helvetica", fontSize: 9, color: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  logo: { width: 110, height: 38 },
  companyInfo: { textAlign: "right", lineHeight: 1.5, fontSize: 8 },
  companyName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: RED, marginBottom: 2 },
  companyLine: { borderBottomWidth: 0.75, borderBottomColor: RED, marginBottom: 2 },
  title: { textAlign: "center", fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6, letterSpacing: 0.5 },
  concernTitle: { textAlign: "center", fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 20, textDecoration: "underline" },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  leftCol: { flex: 1 },
  rightCol: { alignItems: "flex-end" },
  addressLine: { fontSize: 9, marginBottom: 2 },
  refLine: { fontSize: 9, marginBottom: 2 },
  accountRefRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14 },
  accountRefLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", marginRight: 8 },
  accountRefValue: { fontSize: 11, fontFamily: "Helvetica-Bold", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 1, minWidth: 60 },
  accountDashes: { fontSize: 9, marginLeft: 30 },
  body: { fontSize: 9, lineHeight: 1.6, marginBottom: 16 },
  signSection: { marginTop: 36 },
  signLine: { fontSize: 9, marginBottom: 4 },
  footerCenter: { position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#888" },
  footerRight: { position: "absolute", bottom: 32, right: 50, fontSize: 7, color: "#888" },
});

const ReferenceLetterPDF = ({
  property,
  rentData,
  netOutstanding,
  dueDate,
  userName,
  tenant: tenantProp,
}: {
  property?: any;
  rentData?: any;
  netOutstanding?: number;
  dueDate?: string;
  userName?: string;
  tenant?: any;
}) => {
  const tenant = tenantProp || property?.parties?.find((p: any) => p.role === "TENANT")?.party ||
                 property?.tenants?.[0] || {};
  const tenantName = [tenant.title, tenant.firstName || tenant.FirstName, tenant.lastName || tenant.SureName]
    .filter(Boolean).join(" ") || "";
  const propertyAddress = [
    property?.addressLine1 || property?.DoorNumber || "",
    property?.Road || "",
    property?.town || property?.towns || "",
    property?.postCode || "",
  ].filter(Boolean);
  const propertyAddressStr = propertyAddress.join(" ");

  const accountNo = property?.propertyNo || (property?.propertyNumber != null ? String(property.propertyNumber) : "");
  const ref = accountNo ? `${accountNo} - M` : "";
  const today = new Date().toLocaleDateString("en-GB");
  const dueDateFmt = dueDate ? new Date(dueDate).toLocaleDateString("en-GB") : "";
  const amount = netOutstanding != null ? `£${Math.abs(netOutstanding).toFixed(2)}` : "";
  const signer = userName || "Woodland";

  const bodyText = [
    `This is to certify that ${tenantName || "the tenant"} has been our tenant at ${propertyAddressStr}`,
    dueDateFmt ? ` from ${dueDateFmt} to date` : "",
    " during this period we had no issue or problem in this regard",
    amount ? ` and there is ${amount} as outstanding amount.` : ".",
  ].join("");

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
        <Text style={styles.title}>REFERENCE LETTER</Text>

        {/* Two-column: tenant address left, ref/date right */}
        <View style={styles.twoCol}>
          <View style={styles.leftCol}>
            {tenantName ? <Text style={styles.addressLine}>{tenantName}</Text> : null}
            {propertyAddress.map((line, i) => <Text key={i} style={styles.addressLine}>{line}</Text>)}
          </View>
          <View style={styles.rightCol}>
            {ref ? <Text style={styles.refLine}>Ref:  {ref}</Text> : null}
            <Text style={styles.refLine}>Date:  {today}</Text>
          </View>
        </View>

        {/* To Whom */}
        <Text style={styles.concernTitle}>TO WHOM IT MAY CONCERN</Text>

        {/* Account Ref */}
        <View style={styles.accountRefRow}>
          <Text style={styles.accountRefLabel}>Account Ref:</Text>
          <Text style={styles.accountRefValue}>{accountNo}</Text>
          <Text style={styles.accountDashes}>_ _ _ _ _ _ _</Text>
        </View>

        {/* Body */}
        <Text style={styles.body}>{bodyText}</Text>

        <Text style={styles.body}>
          Should you require any further assistance in this regard, please do not hesitate to contact us.
        </Text>

        <Text style={styles.body}>Yours sincerely,</Text>

        {/* Signature */}
        <View style={styles.signSection}>
          <Text style={styles.signLine}>{"\n\n\n"}</Text>
          <Text style={styles.signLine}>{signer}</Text>
          <Text style={styles.signLine}>Woodland</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footerCenter}>SALES &amp; LETTINGS MANAGEMENT</Text>
        <Text style={styles.footerRight}>www.woodlandltd.co.uk</Text>
      </Page>
    </Document>
  );
};

export default ReferenceLetterPDF;
