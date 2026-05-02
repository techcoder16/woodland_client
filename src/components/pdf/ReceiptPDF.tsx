import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logo from "../../assets/logo.png";

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 18,
    paddingRight: 20,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logoBox: {
    width: 120,
    height: 42,
  },
  logoImage: {
    width: 120,
    height: 42,
  },
  companyInfo: {
    textAlign: "right",
    lineHeight: 1.5,
    fontSize: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#dc0032",
    marginBottom: 3,
  },
  companyNameLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#dc0032",
    marginBottom: 3,
  },
  title: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 14,
    letterSpacing: 1.5,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  dateGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 9,
    marginRight: 8,
  },
  dateValue: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    minWidth: 110,
    fontSize: 9,
    paddingBottom: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  fieldLabel: {
    width: 100,
    fontSize: 9,
  },
  fieldValue: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    flex: 1,
    fontSize: 9,
    paddingBottom: 1,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  amountLabel: {
    width: 100,
    fontSize: 9,
  },
  amountBox: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    minWidth: 75,
    marginHorizontal: 6,
    fontSize: 9,
    paddingBottom: 1,
    paddingHorizontal: 5,
  },
  amountSuffix: {
    fontSize: 9,
  },
  signatureSection: {
    marginTop: 24,
    marginLeft: 100,
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 18,
  },
  signatureLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    width: 130,
    marginBottom: 4,
  },
  signerName: {
    fontSize: 9,
  },
  footer: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 7.5,
    color: "#aaa",
    lineHeight: 1.5,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    borderStyle: "dashed",
    marginVertical: 12,
  },
});

const DepositBlock = ({
  label,
  data,
  type,
}: {
  label: string;
  data: any;
  type: "receipt" | "return";
}) => (
  <View style={{ flexDirection: "row" }}>

    {/* Side label — characters stacked vertically in their own column */}
    <View style={{ width: 14, marginRight: 6, justifyContent: "center" }}>
      {label.split("").map((char, i) => (
        <View key={i} style={{ height: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 6.5 }}>{char}</Text>
        </View>
      ))}
    </View>

    {/* Main content */}
    <View style={{ flex: 1 }}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Image src={logo} style={styles.logoImage} />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>WOODLAND</Text>
          <View style={styles.companyNameLine} />
          <Text>235 Cranbrook Road, Ilford, Essex IG1 4TD</Text>
          <Text>Tel: 0208 554 55440   Fax: 020 8554 4433</Text>
          <Text>ig1@woodlandltd.co.uk</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        {type === "receipt" ? "RECEIPT OF DEPOSIT" : "RETURN OF DEPOSIT"}
      </Text>

      {/* Date — right aligned */}
      <View style={styles.dateRow}>
        <View style={styles.dateGroup}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateValue}>{data.date}</Text>
        </View>
      </View>

      {/* Account No */}
      <View style={styles.row}>
        <Text style={styles.fieldLabel}>Account No.</Text>
        <Text style={styles.fieldValue}>{data.accountNo}</Text>
      </View>

      {/* Property Ref */}
      <View style={styles.row}>
        <Text style={styles.fieldLabel}>Property Ref:</Text>
        <Text style={styles.fieldValue}>{data.propertyRef}</Text>
      </View>

      {/* Spacer row */}
      <View style={{ height: 6 }} />

      {/* Received From */}
      <View style={styles.row}>
        <Text style={styles.fieldLabel}>Received from</Text>
        <Text style={styles.fieldValue}>{data.receivedFrom}</Text>
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>The sum of Amount</Text>
        <Text style={styles.amountBox}>{data.amount}</Text>
        <Text style={styles.amountSuffix}>
          {type === "receipt"
            ? "as deposit in above mentioned Account"
            : "as deposit returned in above mentioned Account"}
        </Text>
      </View>

      {/* Signature */}
      <View style={styles.signatureSection}>
        <Text style={styles.signatureLabel}>Signature</Text>
        <View style={styles.signatureLine} />
        <Text style={styles.signerName}>{data.signature}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>SALES LETTINGS MANAGEMENT</Text>
        <Text>www.woodlandltd.co.uk</Text>
      </View>

    </View>
  </View>
);

const DepositPDF = ({
  data,
  type,
}: {
  data: any;
  type: "receipt" | "return";
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <DepositBlock label="CUSTOMER'S COPY" data={data} type={type} />
      <View style={styles.dashedLine} />
      <DepositBlock label="OFFICE COPY" data={data} type={type} />
    </Page>
  </Document>
);

export default DepositPDF;
