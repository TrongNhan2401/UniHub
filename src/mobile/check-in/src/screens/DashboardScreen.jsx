import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, CloudOff, Download, QrCode, ToggleLeft, ToggleRight, Users } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useCheckin } from "../context/CheckinContext";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const {
    isOnline,
    setIsOnline,
    workshops,
    selectedWorkshopId,
    setSelectedWorkshopId,
    selectedWorkshop,
    cachedRegistrations,
    pendingCheckins,
    recentScans,
    preloadForWorkshop,
  } = useCheckin();
  const [notice, setNotice] = useState("");

  const todaySuccess = useMemo(() => recentScans.filter((s) => s.result === "SUCCESS").length, [recentScans]);

  const handlePreload = () => {
    const result = preloadForWorkshop(selectedWorkshopId);
    setNotice(`San sang check-in offline cho ${result.total} sinh vien.`);
  };

  const openScanner = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate("Scan");
      return;
    }
    navigation.navigate("Scan");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={s.header}>
        <View>
          <Text style={s.brand}>UniHub Check-in</Text>
          <Text style={s.headerSub}>Nhan su check-in tai cua phong</Text>
        </View>
        <TouchableOpacity style={s.statusBadge} onPress={() => setIsOnline(!isOnline)}>
          {isOnline ? <ToggleRight size={18} color="#16a34a" /> : <ToggleLeft size={18} color="#ea580c" />}
          <Text style={{ color: isOnline ? "#16a34a" : "#ea580c", fontWeight: "700", marginLeft: 6 }}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        <View style={s.block}>
          <Text style={s.blockTitle}>1) Chon workshop dang check-in</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {workshops.map((w) => (
              <TouchableOpacity
                key={w.id}
                onPress={() => setSelectedWorkshopId(w.id)}
                style={[s.workshopChip, selectedWorkshopId === w.id && s.workshopChipActive]}
              >
                <Text style={[s.workshopChipText, selectedWorkshopId === w.id && s.workshopChipTextActive]}>
                  {w.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.workshopMeta}>
            Phong: {selectedWorkshop.room} · Bat dau: {selectedWorkshop.start}
          </Text>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>2) Preload de san sang offline</Text>
          <TouchableOpacity style={s.preloadBtn} onPress={handlePreload}>
            <Download size={17} color="#fff" />
            <Text style={s.preloadTxt}>Lay danh sach registration da xac nhan</Text>
          </TouchableOpacity>
          {notice ? <Text style={s.notice}>{notice}</Text> : null}
        </View>

        <TouchableOpacity style={s.scanBtn} onPress={openScanner}>
          <QrCode size={24} color="#fff" />
          <Text style={s.scanTxt}>Quet QR check-in</Text>
        </TouchableOpacity>

        <View style={s.statsRow}>
          <StatCard title="Cached" value={String(cachedRegistrations.length)} Icon={Users} tone="blue" />
          <StatCard title="Pending Sync" value={String(pendingCheckins.length)} Icon={CloudOff} tone="orange" />
          <StatCard title="Online Success" value={String(todaySuccess)} Icon={CheckCircle2} tone="green" />
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>Recent</Text>
          {!recentScans.length ? (
            <Text style={s.empty}>Chua co luot quet nao trong phien nay.</Text>
          ) : (
            recentScans.slice(0, 5).map((row) => (
              <View key={`${row.registration_id}-${row.checked_in_at}`} style={s.recentRow}>
                <Text style={s.recentName}>{row.student_name}</Text>
                <Text style={s.recentMeta}>
                  {row.mode} · {row.result}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, Icon, tone }) {
  const colors = {
    blue: { bg: "#dbeafe", fg: "#1d4ed8" },
    orange: { bg: "#ffedd5", fg: "#c2410c" },
    green: { bg: "#dcfce7", fg: "#15803d" },
  };
  const c = colors[tone];
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: c.bg }]}>
        <Icon size={17} color={c.fg} />
      </View>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  brand: { fontSize: 20, fontWeight: "900", color: "#2563eb" },
  headerSub: { fontSize: 12, color: "#64748b" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  block: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  blockTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  workshopChip: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  workshopChipActive: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  workshopChipText: { fontSize: 12, color: "#334155", fontWeight: "600" },
  workshopChipTextActive: { color: "#1d4ed8" },
  workshopMeta: { marginTop: 8, fontSize: 12, color: "#64748b" },
  preloadBtn: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  preloadTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  notice: { marginTop: 8, fontSize: 12, color: "#16a34a", fontWeight: "600" },
  scanBtn: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#1d4ed8",
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  scanTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    padding: 12,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statVal: { fontWeight: "900", fontSize: 18, color: "#0f172a" },
  statLbl: { fontSize: 11, color: "#64748b", marginTop: 2 },
  empty: { marginTop: 8, fontSize: 12, color: "#64748b" },
  recentRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  recentName: { fontSize: 13, color: "#0f172a", fontWeight: "700" },
  recentMeta: { fontSize: 12, color: "#64748b" },
});
