import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, QrCode, WifiOff, Wifi } from "lucide-react-native";
import { useCheckin } from "../context/CheckinContext";

export default function ScanScreen() {
  const navigation = useNavigation();
  const { isOnline, selectedWorkshop, processQr } = useCheckin();
  const [qrInput, setQrInput] = useState("REG-1001");

  const onScan = () => {
    const result = processQr(qrInput);
    navigation.navigate("Result", { result, workshop: selectedWorkshop });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Quet QR check-in</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.body}>
        <View style={s.modeBadge}>
          {isOnline ? <Wifi size={14} color="#16a34a" /> : <WifiOff size={14} color="#ea580c" />}
          <Text style={{ color: isOnline ? "#16a34a" : "#ea580c", fontWeight: "700", marginLeft: 6 }}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
        </View>

        <Text style={s.metaTitle}>{selectedWorkshop.title}</Text>
        <Text style={s.metaSub}>
          Phong {selectedWorkshop.room} · Bat dau {selectedWorkshop.start}
        </Text>

        <View style={s.frame}>
          <QrCode size={58} color="#93c5fd" />
          <Text style={s.frameText}>Nhap QR de mo phong quet</Text>
          <TextInput
            value={qrInput}
            onChangeText={setQrInput}
            placeholder="REG-1001"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            style={s.input}
          />
          <TouchableOpacity style={s.demoBtn} onPress={() => setQrInput("REG-1002")}>
            <Text style={s.demoTxt}>Dung QR mau REG-1002</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.scanBtn} onPress={onScan}>
          <Text style={s.scanTxt}>{isOnline ? "Validate va check-in" : "Luu offline"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  title: { color: "#fff", fontWeight: "800", fontSize: 16 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  modeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  metaTitle: { marginTop: 14, color: "#fff", fontWeight: "800", fontSize: 20 },
  metaSub: { color: "#cbd5e1", marginTop: 4, fontSize: 12 },
  frame: {
    marginTop: 18,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  frameText: { color: "#cbd5e1", marginTop: 10, marginBottom: 12 },
  input: {
    width: "100%",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontWeight: "700",
  },
  demoBtn: { marginTop: 10 },
  demoTxt: { color: "#60a5fa", fontSize: 12, fontWeight: "700" },
  scanBtn: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  scanTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
