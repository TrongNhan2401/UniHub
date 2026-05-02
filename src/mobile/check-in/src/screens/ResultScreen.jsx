import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AlertTriangle, CheckCircle2, ChevronLeft, Clock3, WifiOff } from "lucide-react-native";

export default function ResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { result, workshop } = route.params || {};

  const status = result?.status || "INVALID";
  const ok = Boolean(result?.ok);

  const tone = status === "SUCCESS" ? "green" : status === "PENDING_SYNC" ? "orange" : "red";

  const colors = {
    green: { bg: "#dcfce7", fg: "#15803d" },
    orange: { bg: "#ffedd5", fg: "#c2410c" },
    red: { bg: "#fee2e2", fg: "#b91c1c" },
  }[tone];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ket qua quet</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.body}>
        <View style={[s.hero, { backgroundColor: colors.bg }]}>
          {status === "SUCCESS" ? (
            <CheckCircle2 size={48} color={colors.fg} />
          ) : status === "PENDING_SYNC" ? (
            <WifiOff size={48} color={colors.fg} />
          ) : (
            <AlertTriangle size={48} color={colors.fg} />
          )}
          <Text style={[s.heroTitle, { color: colors.fg }]}>
            {status === "SUCCESS"
              ? "Check-in thanh cong"
              : status === "PENDING_SYNC"
                ? "Da luu offline"
                : "Check-in that bai"}
          </Text>
          <Text style={s.heroMsg}>{result?.message || "Khong co ket qua"}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Workshop</Text>
          <Text style={s.value}>{workshop?.title || "-"}</Text>
          <Text style={s.sub}>{workshop?.room ? `Phong ${workshop.room}` : ""}</Text>

          <View style={s.divider} />
          <Text style={s.label}>Student</Text>
          <Text style={s.value}>{result?.payload?.student_name || "-"}</Text>
          <Text style={s.sub}>{result?.payload?.student_id || "-"}</Text>

          <View style={s.divider} />
          <Text style={s.label}>Registration</Text>
          <Text style={s.value}>
            {result?.payload?.registration_id ? `REG-${result.payload.registration_id}` : "-"}
          </Text>

          {result?.payload?.checked_in_at ? (
            <View style={s.timeRow}>
              <Clock3 size={14} color="#64748b" />
              <Text style={s.sub}> {new Date(result.payload.checked_in_at).toLocaleString()}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={s.primary} onPress={() => navigation.navigate("Scan")}>
          <Text style={s.primaryTxt}>Quet tiep</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.secondary} onPress={() => navigation.navigate("Main", { screen: "Sync" })}>
          <Text style={s.secondaryTxt}>{ok ? "Mo man hinh Sync" : "Kiem tra hang doi"}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  body: { flex: 1, padding: 18 },
  hero: { borderRadius: 16, padding: 18, alignItems: "center" },
  heroTitle: { marginTop: 10, fontSize: 22, fontWeight: "900" },
  heroMsg: { marginTop: 8, fontSize: 13, color: "#475569", textAlign: "center" },
  card: { marginTop: 14, backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  label: { fontSize: 11, color: "#64748b", fontWeight: "700", letterSpacing: 0.3 },
  value: { marginTop: 3, fontSize: 16, color: "#0f172a", fontWeight: "800" },
  sub: { marginTop: 2, fontSize: 12, color: "#64748b" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 10 },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  primary: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13,
  },
  primaryTxt: { color: "#fff", fontWeight: "800" },
  secondary: { marginTop: 10, alignItems: "center", paddingVertical: 12 },
  secondaryTxt: { color: "#2563eb", fontWeight: "700" },
});
