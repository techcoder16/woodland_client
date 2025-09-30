import React, { useEffect } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import logo from "@/assets/logo.png" 
// Styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  logo: {
    width: 120,
    marginBottom: 20,
  },
  addressBlock: {
    marginTop: 40,
    marginBottom: 60,
  },
  sender: {
    marginTop: 200,
    fontSize: 10,
    textAlign: "right",
    color: "black",
  },
});

const EnvelopePDF = ({ recipient, sender }: any) => (

 

  <Document>
    <Page size="A4" style={styles.page}>
      {/* Logo */}
      <Image style={styles.logo} src={logo} /> {/* Replace with your Woodland logo */}

      {/* Recipient Address */}
      <View style={styles.addressBlock}>
              <Text></Text>
        <Text>{recipient?.name}</Text>
        <Text>{recipient?.addressLine1}</Text>
        {recipient?.addressLine2 && <Text>{recipient?.addressLine2}</Text>}
        <Text>{recipient?.city}</Text>
        <Text>{recipient?.postcode}</Text>
      </View>

      {/* Sender Address */}
      <View style={styles.sender}>
        <Text>WOODLAND</Text>
        <Text>{sender?.addressLine1}</Text>
        <Text>{sender?.city}, {sender?.postcode}</Text>
      </View>
    </Page>
  </Document>
);

export default EnvelopePDF;
