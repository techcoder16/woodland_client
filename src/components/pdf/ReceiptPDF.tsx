import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// 🎨 Styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#000",
    backgroundColor: "#fff",
  },
  receipt: {
    position: "relative",
    marginBottom: 40,
  },
  leftLabel: {
    position: "absolute",
    left: -70,
    top: "40%",
    transform: "rotate(-90deg)",
    fontSize: 11,
    letterSpacing: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  logoBox: {
    width: 130,
    height: 50,
    backgroundColor: "#dc0032",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  companyInfo: {
    textAlign: "right",
    lineHeight: 1.3,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc0032",
    marginBottom: 2,
  },
  title: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "bold",
    marginVertical: 20,
    letterSpacing: 1.5,
  },
  contentArea: {
    marginLeft: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    width: 120,
  },
  underline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    flex: 1,
    minHeight: 12,
  },
  rowWithDate: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dateGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabel: {
    marginRight: 10,
  },
  dateUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minWidth: 100,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  amountLabel: {
    width: 120,
  },
  amountUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingHorizontal: 30,
    minWidth: 80,
    marginHorizontal: 10,
  },
  paragraph: {
    fontSize: 10,
    marginTop: -2,
  },
  signatureSection: {
    marginTop: 40,
    marginLeft: 120,
  },
  signatureLabel: {
    marginBottom: 30,
  },
  footer: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 8,
    color: "#999",
    lineHeight: 1.4,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderStyle: "dashed",
    marginVertical: 35,
  },
});

// 🧾 Single Receipt Copy
const ReceiptBlock = ({ label, data }: any) => (
  <View style={styles.receipt}>
    <Text style={styles.leftLabel}>{label}</Text>

    {/* Header */}
    <View style={styles.header}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>Woodland</Text>
      </View>
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>WOODLAND</Text>
        <Text>235 Cranbrook Road, Ilford, Essex IG1 4TD</Text>
        <Text>Tel: 0208 554 55440   Fax: 020 8554 4433</Text>
        <Text>ig1@woodlandltd.co.uk</Text>
      </View>
    </View>

    {/* Title */}
    <Text style={styles.title}>RETURN OF DEPOSIT</Text>

    {/* Content */}
    <View style={styles.contentArea}>
      <View style={styles.rowWithDate}>
        <View style={styles.row}>
          <Text style={styles.label}>Account No.</Text>
          <Text style={styles.underline}>{data.accountNo}</Text>
        </View>
        <View style={styles.dateGroup}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateUnderline}>{data.date}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Property Ref:</Text>
        <Text style={styles.underline}>{data.propertyRef}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Received from</Text>
        <Text style={styles.underline}>{data.receivedFrom}</Text>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>The sum of Amount</Text>
        <Text style={styles.amountUnderline}>{data.amount}</Text>
        <Text style={styles.paragraph}>as deposit returned in above mentioned Account</Text>
      </View>
    </View>

    {/* Signature */}
    <View style={styles.signatureSection}>
      <Text style={styles.signatureLabel}>Signature</Text>
      <Text>{data.signature}</Text>
    </View>

    {/* Footer */}
    <View style={styles.footer}>
      <Text>SALES LETTINGS MANAGEMENT</Text>
      <Text>www.woodlandltd.co.uk</Text>
    </View>
  </View>
);

// 📄 Main PDF Document
const ReturnDepositPDF = ({ data }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReceiptBlock label="CUSTOMER COPY" data={data} />
      <View style={styles.dashedLine} />
      <ReceiptBlock label="OFFICE COPY" data={data} />
    </Page>
  </Document>
);

export default ReturnDepositPDF;
