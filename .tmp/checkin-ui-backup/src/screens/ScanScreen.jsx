import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { X, Zap, WifiOff, CheckCircle2, ChevronRight, ScanLine } from "lucide-react-native";

const recentScans = [
  { id: 1, name: "Marcus Thompson", studentId: "249910", time: "2m ago", status: "verified" },
  { id: 2, name: "Elena Rodriguez", studentId: "248812", time: "5m ago", status: "verified" },
  { id: 3, name: "James Park", studentId: "247601", time: "12m ago", status: "offline" },
];

export default function ScanScreen() {
  const navigation = useNavigation();
  const [flash, setFlash] = useState(false);
  const [offline] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Camera area */}
      <View style={s.cameraArea}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <X size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Scan QR Code</Text>
          <TouchableOpacity
            onPress={() => setFlash(!flash)}
            style={[s.iconBtn, flash && { backgroundColor: "#fbbf24" }]}
          >
            <Zap size={20} color={flash ? "#0f172a" : "#fff"} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Offline badge */}
        {offline && (
          <View style={s.offlineBadge}>
            <WifiOff size={13} color="#fff" strokeWidth={2} />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", marginLeft: 6 }}>OFFLINE MODE</Text>
          </View>
        )}

        {/* QR Frame */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={s.qrFrame}>
            <View style={[s.corner, s.topLeft]} />
            <View style={[s.corner, s.topRight]} />
            <View style={[s.corner, s.bottomLeft]} />
            <View style={[s.corner, s.bottomRight]} />
            <View style={s.scanLine} />
            <View style={s.scanIconCenter}>
              <ScanLine size={30} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
            </View>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 20, textAlign: "center" }}>
            Position the student's QR code{"\n"}within the frame to scan
          </Text>
        </View>

        {/* Simulate scan */}
        <TouchableOpacity style={s.simulateBtn} onPress={() => navigation.navigate("Result")} activeOpacity={0.85}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Simulate Scan</Text>
          <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Recent scans bottom sheet */}
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ fontWeight: "800", fontSize: 16, color: "#0f172a" }}>Recent Scans</Text>
          <View style={s.countBadge}>
            <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 12 }}>{recentScans.length} today</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentScans.map((item, i) => (
            <View key={item.id} style={[s.scanRow, i > 0 && { borderTopWidth: 1, borderColor: "#f1f5f9" }]}>
              <View style={[s.avatarCircle, { backgroundColor: item.status === "offline" ? "#fee2e2" : "#dbeafe" }]}>
                <Text
                  style={{ fontWeight: "700", fontSize: 13, color: item.status === "offline" ? "#dc2626" : "#2563eb" }}
                >
                  {item.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  ID: {item.studentId} · {item.time}
                </Text>
              </View>
              {item.status === "verified" ? (
                <CheckCircle2 size={18} color="#16a34a" strokeWidth={2} />
              ) : (
                <WifiOff size={18} color="#ea580c" strokeWidth={2} />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const CORNER = 22;

const s = StyleSheet.create({
  cameraArea: { flex: 1, backgroundColor: "#0f172a" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  offlineBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ea580c",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  qrFrame: {
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "#2563eb",
    borderWidth: 3.5,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  scanLine: {
    position: "absolute",
    width: 200,
    height: 2,
    backgroundColor: "#2563eb",
    opacity: 0.7,
  },
  scanIconCenter: { width: 60, height: 60, justifyContent: "center", alignItems: "center" },
  simulateBtn: {
    margin: 18,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 10,
    maxHeight: 280,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
