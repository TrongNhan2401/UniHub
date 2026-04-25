import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { CheckCircle2, User, ChevronLeft, Star, BookOpen, RotateCcw } from "lucide-react-native";

const student = {
  name: "Alexander J. Rivera",
  id: "U-2024-8842",
  status: "Verified",
  workshop: "Advanced UI Design & Design Systems",
  credits: 2.5,
  room: "Room B04",
  time: "2:00 PM – 4:00 PM",
};

export default function ResultScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={22} color="#374151" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>Check-in Result</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success hero */}
        <View style={{ alignItems: "center", marginTop: 28, marginBottom: 28 }}>
          <View style={s.successRing}>
            <CheckCircle2 size={56} color="#16a34a" strokeWidth={1.8} />
          </View>
          <Text style={s.successTitle}>Check-in Confirmed</Text>
          <Text style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>Student successfully verified</Text>
        </View>

        {/* Student card */}
        <View style={s.card}>
          <View style={s.studentRow}>
            <View style={s.avatarCircle}>
              <User size={26} color="#2563eb" strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "600", letterSpacing: 0.3 }}>STUDENT</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a", marginTop: 2 }}>{student.name}</Text>
              <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>ID: {student.id}</Text>
            </View>
            <View style={s.verifiedBadge}>
              <CheckCircle2 size={12} color="#16a34a" strokeWidth={2.5} />
              <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "700", marginLeft: 4 }}>Verified</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Workshop info */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={s.iconBox}>
              <BookOpen size={18} color="#2563eb" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "600", letterSpacing: 0.3 }}>WORKSHOP</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", marginTop: 2 }}>
                {student.workshop}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                {student.room} · {student.time}
              </Text>
            </View>
          </View>
        </View>

        {/* CPD credits */}
        <View style={s.cpdBanner}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Star size={16} color="#d97706" strokeWidth={2} fill="#fbbf24" />
            <Text style={{ fontWeight: "700", color: "#92400e", fontSize: 14 }}>CPD Credits</Text>
          </View>
          <Text style={{ color: "#78350f", fontSize: 13, marginTop: 6, lineHeight: 20 }}>
            Completing this workshop earns <Text style={{ fontWeight: "800" }}>{student.credits} CPD credits</Text> upon
            attendance verification.
          </Text>
        </View>

        {/* Confirm CTA */}
        <TouchableOpacity style={s.confirmBtn} onPress={() => navigation.navigate("Main")} activeOpacity={0.85}>
          <CheckCircle2 size={18} color="#fff" strokeWidth={2.5} />
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Confirm Check-in</Text>
        </TouchableOpacity>

        {/* Rescan */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.rescanBtn} activeOpacity={0.7}>
          <RotateCcw size={15} color="#2563eb" strokeWidth={2} />
          <Text style={{ color: "#2563eb", fontSize: 14, fontWeight: "600", marginLeft: 6 }}>Cancel and Rescan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  successRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  successTitle: { fontSize: 26, fontWeight: "900", color: "#15803d", marginTop: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  studentRow: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 16 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  cpdBanner: {
    backgroundColor: "#fef3c7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
  },
  confirmBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 14,
  },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
});
