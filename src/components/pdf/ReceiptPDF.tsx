import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import logo from "@/assets/logo.png"; // Make sure the Woodland logo is stored here

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 12,
    color: "#000",
  },
  header: {
    alignItems: "center",
    textAlign: "center",
    marginBottom: 10,
  },
  logo: {
    width: 100,
    marginBottom: 6,
  },
  companyInfo: {
    textAlign: "center",
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.3,
  },
  tagline: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginVertical: 12,
  },
  title: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "bold",
  },
  section: {
    marginVertical: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  label: {
    fontWeight: "bold",
  },
  signature: {
    marginTop: 40,
    textAlign: "left",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
  },
});

interface ReceiptData {
  company: {
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
    phone: string;
    fax: string;
    email: string;
    website: string;
    tagline: string;
  };
  receipt: {
    type: string;
    propertyRef: string;
    accountNo: string;
    receivedFrom: string;
    date: string;
    amount: string;
    description: string;
    signature: string;
  };
}

interface Props {
  data: ReceiptData;
}

const ReceiptPDF: React.FC<Props> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image style={styles.logo} src={logo} />
        <Text style={styles.companyInfo}>{data.company.name}</Text>
        <Text style={styles.companyInfo}>
          {data.company.addressLine1}, {data.company.city} {data.company.postcode}
        </Text>
        <Text style={styles.companyInfo}>
          Tel: {data.company.phone} | Fax: {data.company.fax}
        </Text>
        <Text style={styles.companyInfo}>
          {data.company.email} | {data.company.website}
        </Text>
        <Text style={styles.tagline}>{data.company.tagline}</Text>
      </View>

      <View style={styles.divider} />

      {/* Title */}
      <Text style={styles.title}>{data.receipt.type}</Text>

      {/* Receipt Information */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text>{data.receipt.date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Account No:</Text>
          <Text>{data.receipt.accountNo}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Received From:</Text>
          <Text>{data.receipt.receivedFrom}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Amount:</Text>
          <Text>{data.receipt.amount}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Property Ref:</Text>
          <Text>{data.receipt.propertyRef}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Description:</Text>
          <Text>{data.receipt.description}</Text>
        </View>
      </View>

      {/* Signature */}
      <View style={styles.signature}>
        <Text>Signature</Text>
        <Text>{data.receipt.signature}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>{data.company.tagline}</Text>
      </View>
    </Page>
  </Document>
);

export default ReceiptPDF;
