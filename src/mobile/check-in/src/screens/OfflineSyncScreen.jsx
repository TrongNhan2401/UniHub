import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react-native";
import { useCheckin } from "../context/CheckinContext";

export default function OfflineSyncScreen() {
  const { isOnline, pendingCheckins, syncNow, lastSyncSummary } = useCheckin();
  const [message, setMessage] = useState("");

  const pending = useMemo(() => pendingCheckins.filter((p) => p.sync_status === "PENDING"), [pendingCheckins]);

  const onSync = () => {
    const result = syncNow();
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(
      `Da dong bo ${result.summary.inserted}/${result.summary.total} ban ghi. Trung lap ${result.summary.duplicates}.`,
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={s.header}>
        <View>
          <Text style={s.brand}>Dong bo check-in</Text>
          <Text style={s.sub}>Batch sync tu queue offline</Text>
        </View>
        <View style={[s.badge, { backgroundColor: isOnline ? "#dcfce7" : "#ffedd5" }]}>
          {isOnline ? <Wifi size={14} color="#15803d" /> : <WifiOff size={14} color="#c2410c" />}
          <Text style={{ marginLeft: 6, color: isOnline ? "#15803d" : "#c2410c", fontWeight: "700" }}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
        <View style={s.statsRow}>
          <StatCard title="Pending" value={String(pending.length)} Icon={CloudOff} tone="orange" />
          <StatCard
            title="Last Inserted"
            value={String(lastSyncSummary?.inserted || 0)}
            Icon={CheckCircle2}
            tone="green"
          />
        </View>

        <TouchableOpacity onPress={onSync} style={[s.syncBtn, !isOnline && { backgroundColor: "#94a3b8" }]}>
          <RefreshCw size={18} color="#fff" />
          <Text style={s.syncTxt}>{isOnline ? "Sync now" : "Can online de sync"}</Text>
        </TouchableOpacity>

        {message ? <Text style={s.msg}>{message}</Text> : null}

        <View style={s.card}>
          <Text style={s.cardTitle}>Pending queue</Text>
          {!pending.length ? (
            <Text style={s.empty}>Khong co du lieu cho dong bo.</Text>
          ) : (
            pending.map((p) => (
              <View key={p.sync_key} style={s.row}>
                <View>
                  <Text style={s.name}>{p.student_name}</Text>
                  <Text style={s.meta}>
                    REG-{p.registration_id} · {new Date(p.checked_in_at).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={s.pendingTag}>PENDING</Text>
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
    orange: { bg: "#ffedd5", fg: "#c2410c" },
    green: { bg: "#dcfce7", fg: "#15803d" },
  };
  const c = colors[tone];
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: c.bg }]}>
        <Icon size={16} color={c.fg} />
      </View>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  sub: { fontSize: 12, color: "#64748b" },
  badge: { flexDirection: "row", alignItems: "center", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center" },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statVal: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  statLbl: { fontSize: 11, color: "#64748b" },
  syncBtn: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  syncTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  msg: { marginTop: 8, fontSize: 12, color: "#15803d", fontWeight: "700" },
  card: { marginTop: 14, backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  cardTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  empty: { color: "#64748b", fontSize: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  name: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  meta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  pendingTag: {
    fontSize: 11,
    color: "#c2410c",
    fontWeight: "800",
    backgroundColor: "#ffedd5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
