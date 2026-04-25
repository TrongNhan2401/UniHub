import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QrCode, WifiOff, Clock, CheckCircle2, Users } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

const stats = [
  { label: "Checked In Today", value: "142", icon: CheckCircle2, color: "#16a34a", bg: "#dcfce7" },
  { label: "Pending Sync", value: "5", icon: WifiOff, color: "#ea580c", bg: "#ffedd5" },
  { label: "Total Students", value: "318", icon: Users, color: "#2563eb", bg: "#dbeafe" },
];

const recentActivity = [
  { name: "Marcus Thompson", id: "249910", time: "2m ago", status: "verified" },
  { name: "Elena Rodriguez", id: "248812", time: "5m ago", status: "verified" },
  { name: "James Park", id: "247601", time: "12m ago", status: "verified" },
];

export default function DashboardScreen() {
  const navigation = useNavigation();

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
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.brand}>UniHub</Text>
          <Text style={s.headerSub}>Check-in Dashboard</Text>
        </View>
        <View style={s.onlineDot}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a", marginRight: 6 }} />
          <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: "600" }}>Online</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Scan button */}
        <TouchableOpacity style={s.scanBtn} onPress={openScanner} activeOpacity={0.85}>
          <View style={s.scanBtnInner}>
            <QrCode size={28} color="#fff" strokeWidth={2} />
            <View style={{ marginLeft: 14 }}>
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>Scan Student QR</Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>
                Tap to open camera scanner
              </Text>
            </View>
          </View>
          <View style={s.scanArrow}>
            <Text style={{ color: "#fff", fontSize: 20 }}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <Text style={s.sectionTitle}>Today's Overview</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {stats.map((item) => (
            <View key={item.label} style={[s.statCard, { flex: 1 }]}>
              <View style={[s.statIcon, { backgroundColor: item.bg }]}>
                <item.icon size={18} color={item.color} strokeWidth={2} />
              </View>
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={[s.sectionTitle, { marginTop: 22 }]}>Recent Check-ins</Text>
        <View style={s.card}>
          {recentActivity.map((item, i) => (
            <View key={item.id} style={[s.activityRow, i > 0 && { borderTopWidth: 1, borderColor: "#f1f5f9" }]}>
              <View style={s.avatarCircle}>
                <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 14 }}>
                  {item.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>ID: {item.id}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <CheckCircle2 size={16} color="#16a34a" strokeWidth={2} />
                <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Workshop info */}
        <View style={s.workshopBanner}>
          <Clock size={16} color="#2563eb" strokeWidth={2} />
          <Text style={{ color: "#1d4ed8", fontSize: 13, marginLeft: 10, flex: 1 }}>
            <Text style={{ fontWeight: "700" }}>Advanced UI Design</Text> starts at 2:00 PM · Room B04
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  brand: { fontSize: 20, fontWeight: "900", color: "#2563eb", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 1 },
  onlineDot: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scanBtn: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#2563eb",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  scanBtnInner: { flexDirection: "row", alignItems: "center" },
  scanArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#374151", marginTop: 22, marginBottom: 12 },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 10, color: "#64748b", marginTop: 3, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  workshopBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
});
