/**
 * COMPONENT: IPModal (Mobile)
 * Modal dialog to change the server IP address.
 */

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

const IPModal = ({ visible, currentIP, onSave, onCancel }) => {
  const [ipInput, setIpInput] = useState(currentIP);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>WING CONNECTION SETTINGS</Text>

          <TextInput
            value={ipInput}
            onChangeText={setIpInput}
            keyboardType="numeric"
            placeholder="e.g. 192.168.1.15"
            placeholderTextColor="#484d6b"
            style={styles.input}
          />

          <Text style={styles.tip}>
            Enter your host computer's local IP. Make sure you're on the same WiFi network.
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onCancel}>
              <Text style={styles.btnCancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={() => onSave(ipInput)}>
              <Text style={styles.btnSaveText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  card:         { width: "85%", backgroundColor: "#121420", borderRadius: 14, padding: 22, borderWidth: 1.5, borderColor: "#1a1e36" },
  title:        { color: "#fff", fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 14, textAlign: "center" },
  input:        { backgroundColor: "#08090d", borderWidth: 1, borderColor: "#1a1e36", color: "#fff", borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8 },
  tip:          { color: "#484d6b", fontSize: 10, lineHeight: 14, marginBottom: 14 },
  btnRow:       { flexDirection: "row", gap: 10 },
  btn:          { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  btnCancel:    { backgroundColor: "#161824", borderWidth: 1, borderColor: "#30344d" },
  btnCancelText:{ color: "#9ca3af", fontWeight: "bold", fontSize: 12 },
  btnSave:      { backgroundColor: COLORS.cyan },
  btnSaveText:  { color: "#000", fontWeight: "bold", fontSize: 12 },
});

export default IPModal;
