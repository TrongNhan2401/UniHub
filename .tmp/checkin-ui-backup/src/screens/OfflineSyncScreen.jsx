import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WifiOff, RefreshCw, Bell, Trash2, HardDrive, User, CheckCircle2 } from "lucide-react-native";

const pendingItems = [
  { id: 1, name: "Alex Rivera", initials: "AR", time: "10:45 AM", room: "Workshop A12", workshop: "Advanced Robotics" },
  {
    id: 2,
    name: "Sarah Jenkins",
    initials: "SJ",
    time: "11:02 AM",
    room: "Workshop B04",
    workshop: "UX Research Methods",
  },
  {
    id: 3,
    name: "David Chen",
    initials: "DC",
    time: "11:15 AM",
    room: "Workshop C01",
    workshop: "Quantum Computing Basics",
  },
  {
    id: 4,
    name: "Marcus Thorne",
    initials: "MT",
    time: "11:30 AM",
    room: "Workshop A12",
    workshop: "Advanced Robotics",
  },
  {
    id: 5,
    name: "Maya Patel",
    initials: "MP",
    time: "11:45 AM",
    room: "Workshop B04",
    workshop: "UX Research Methods",
  },
];

export default function OfflineSyncScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.brand}>UniHub</Text>
          <Text style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>Offline Sync</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={s.headerIcon}>
            <Bell size={18} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={s.avatarSmall}>
            <User size={16} color="#2563eb" strokeWidth={2} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline hero */}
        <View style={s.offlineHero}>
          <View style={s.offlineIconBox}>
            <WifiOff size={32} color="#ea580c" strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a" }}>Offline Mode Active</Text>
            <Text style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 20 }}>
              Disconnected from university network. Changes saved locally.
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={[s.statCard, { flex: 1 }]}>
            <View style={[s.statIcon, { backgroundColor: "#ffedd5" }]}>
              <HardDrive size={18} color="#ea580c" strokeWidth={2} />
            </View>
            <Text style={s.statVal}>5</Text>
            <Text style={s.statLbl}>Pending{"\n"}Check-ins</Text>
          </View>
          <View style={[s.statCard, { flex: 1 }]}>
            <View style={[s.statIcon, { backgroundColor: "#fee2e2" }]}>
              <WifiOff size={18} color="#dc2626" strokeWidth={2} />
            </View>
            <Text style={s.statVal}>0%</Text>
            <Text style={s.statLbl}>Network{"\n"}Signal</Text>
          </View>
          <View style={[s.statCard, { flex: 1 }]}>
            <View style={[s.statIcon, { backgroundColor: "#dcfce7" }]}>
              <CheckCircle2 size={18} color="#16a34a" strokeWidth={2} />
            </View>
            <Text style={s.statVal}>142</Text>
            <Text style={s.statLbl}>Synced{"\n"}Today</Text>
          </View>
        </View>

        {/* Sync button */}
        <TouchableOpacity style={s.syncBtn} activeOpacity={0.85}>
          <RefreshCw size={18} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", marginLeft: 8 }}>Sync Now</Text>
        </TouchableOpacity>

        {/* Queue */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 22,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#0f172a" }}>Pending Sync Queue</Text>
          <View style={{ backgroundColor: "#ffedd5", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: "#ea580c", fontWeight: "700", fontSize: 12 }}>Awaiting Upload</Text>
          </View>
        </View>

        <View style={s.queueCard}>
          {pendingItems.map((item, index) => (
            <View key={item.id} style={[s.queueRow, index > 0 && { borderTopWidth: 1, borderColor: "#f1f5f9" }]}>
              <View style={s.initAvatar}>
                <Text style={{ fontWeight: "800", fontSize: 13, color: "#2563eb" }}>{item.initials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {item.time} · {item.room}
                </Text>
                <View style={s.workshopTag}>
                  <Text style={{ fontSize: 11, color: "#dc2626", fontWeight: "600" }}>{item.workshop}</Text>
                </View>
              </View>
              <TouchableOpacity style={{ padding: 8 }}>
                <Trash2 size={16} color="#94a3b8" strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          ))}
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
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  offlineHero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    marginBottom: 16,
  },
  offlineIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#ffedd5",
    justifyContent: "center",
    alignItems: "center",
  },
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
  statVal: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  statLbl: { fontSize: 10, color: "#64748b", textAlign: "center", marginTop: 3 },
  syncBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 4,
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  queueCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  initAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  workshopTag: {
    alignSelf: "flex-start",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
  },
});
