import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle2,
  Check,
  CloudOff,
  Download,
  QrCode,
  Search,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from "lucide-react-native";
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
  const [pickerVisible, setPickerVisible] = useState(false);
  const [workshopQuery, setWorkshopQuery] = useState("");

  const todaySuccess = useMemo(() => recentScans.filter((s) => s.result === "SUCCESS").length, [recentScans]);

  const filteredWorkshops = useMemo(() => {
    const query = workshopQuery.trim().toLowerCase();
    if (!query) return workshops;
    return workshops.filter((w) => {
      return w.title.toLowerCase().includes(query) || w.room.toLowerCase().includes(query) || w.id.includes(query);
    });
  }, [workshopQuery, workshops]);

  const handlePreload = async () => {
    const result = await preloadForWorkshop(selectedWorkshopId);
    if (!result.success) {
      setNotice(result.message || "Không thể tải trước dữ liệu.");
      return;
    }
    setNotice(`Sẵn sàng check-in offline cho ${result.total} sinh viên.`);
  };

  const openScanner = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate("Scan");
      return;
    }
    navigation.navigate("Scan");
  };

  const onSelectWorkshop = (workshopId) => {
    setSelectedWorkshopId(workshopId);
    setPickerVisible(false);
    setWorkshopQuery("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={s.header}>
        <View>
          <Text style={s.brand}>UniHub Check-in</Text>
          <Text style={s.headerSub}>Nhân sự check-in tại cửa phòng</Text>
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
          <Text style={s.blockTitle}>1) Chọn workshop đang check-in</Text>
          <TouchableOpacity style={s.workshopSelector} onPress={() => setPickerVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={s.selectorLabel}>Workshop đã chọn</Text>
              <Text style={s.selectorValue} numberOfLines={1}>
                {selectedWorkshop.title || "Chưa có workshop"}
              </Text>
            </View>
            <Text style={s.selectorAction}>Chọn</Text>
          </TouchableOpacity>
          <Text style={s.selectorHint}>Nhấn "Chọn" để mở danh sách và tìm kiếm nhanh theo tên hoặc phòng.</Text>
          <Text style={s.workshopMeta}>
            Phòng: {selectedWorkshop.room} · Bắt đầu: {selectedWorkshop.start}
          </Text>
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>2) Tải trước dữ liệu để sẵn sàng offline</Text>
          <TouchableOpacity style={s.preloadBtn} onPress={handlePreload}>
            <Download size={17} color="#fff" />
            <Text style={s.preloadTxt}>Lấy danh sách đăng ký đã xác nhận</Text>
          </TouchableOpacity>
          {notice ? <Text style={s.notice}>{notice}</Text> : null}
        </View>

        <TouchableOpacity style={s.scanBtn} onPress={openScanner}>
          <QrCode size={24} color="#fff" />
          <Text style={s.scanTxt}>Quét mã QR check-in</Text>
        </TouchableOpacity>

        <View style={s.statsRow}>
          <StatCard title="Đã tải trước" value={String(cachedRegistrations.length)} Icon={Users} tone="blue" />
          <StatCard title="Chờ đồng bộ" value={String(pendingCheckins.length)} Icon={CloudOff} tone="orange" />
          <StatCard title="Thành công online" value={String(todaySuccess)} Icon={CheckCircle2} tone="green" />
        </View>

        <View style={s.block}>
          <Text style={s.blockTitle}>Lượt quét gần đây</Text>
          {!recentScans.length ? (
            <Text style={s.empty}>Chưa có lượt quét nào trong phiên này.</Text>
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

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Chọn workshop</Text>
                <Text style={s.modalSub}>Tìm nhanh theo tên workshop hoặc phòng.</Text>
              </View>
              <TouchableOpacity style={s.modalCloseBtn} onPress={() => setPickerVisible(false)}>
                <X size={18} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={s.searchBox}>
              <Search size={16} color="#64748b" />
              <TextInput
                style={s.searchInput}
                placeholder="Nhập tên workshop hoặc phòng..."
                placeholderTextColor="#94a3b8"
                value={workshopQuery}
                onChangeText={setWorkshopQuery}
                autoCapitalize="none"
              />
            </View>

            <Text style={s.searchCount}>Kết quả: {filteredWorkshops.length} workshop</Text>

            <ScrollView style={s.resultList} keyboardShouldPersistTaps="handled">
              {!filteredWorkshops.length ? (
                <Text style={s.emptyResult}>Không tìm thấy workshop phù hợp.</Text>
              ) : (
                filteredWorkshops.map((w) => {
                  const active = selectedWorkshopId === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[s.workshopRow, active && s.workshopRowActive]}
                      onPress={() => onSelectWorkshop(w.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.workshopRowTitle, active && s.workshopRowTitleActive]} numberOfLines={1}>
                          {w.title}
                        </Text>
                        <Text style={s.workshopRowMeta}>
                          Phòng {w.room} · Bắt đầu {w.start}
                        </Text>
                      </View>
                      {active ? <Check size={16} color="#1d4ed8" /> : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  workshopSelector: {
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
  },
  selectorLabel: { fontSize: 11, color: "#64748b", fontWeight: "700" },
  selectorValue: { marginTop: 2, fontSize: 14, color: "#0f172a", fontWeight: "700" },
  selectorAction: { color: "#1d4ed8", fontSize: 13, fontWeight: "800" },
  selectorHint: { marginTop: 8, fontSize: 12, color: "#64748b" },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  modalSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  searchBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    paddingVertical: 10,
  },
  searchCount: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  resultList: { marginTop: 8 },
  emptyResult: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 18,
  },
  workshopRow: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  workshopRowActive: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
  },
  workshopRowTitle: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "700",
  },
  workshopRowTitleActive: { color: "#1d4ed8" },
  workshopRowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
});
