import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, QrCode, WifiOff, Wifi, Camera as CameraIcon, Keyboard } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCheckin } from "../context/CheckinContext";

export default function ScanScreen() {
  const navigation = useNavigation();
  const { isOnline, selectedWorkshop, processQr } = useCheckin();

  // Web: text-input mode. Native: camera mode (default)
  const [mode, setMode] = useState(Platform.OS === "web" ? "manual" : "camera");
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const lastScanned = useRef("");

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (mode === "camera" && Platform.OS !== "web" && !permission?.granted) {
      requestPermission();
    }
  }, [mode]);

  const handleQrResult = async (qrCode) => {
    if (scanning || !qrCode?.trim()) return;
    if (qrCode === lastScanned.current) return; // debounce same QR
    lastScanned.current = qrCode;
    setScanning(true);
    try {
      const result = await processQr(qrCode.trim());
      navigation.navigate("Result", { result, workshop: selectedWorkshop });
    } finally {
      setScanning(false);
      // reset so same QR can be scanned again after returning
      setTimeout(() => {
        lastScanned.current = "";
      }, 3000);
    }
  };

  const onBarcodeScanned = ({ data }) => {
    handleQrResult(data);
  };

  const onManualSubmit = () => {
    handleQrResult(qrInput.trim());
  };

  const cameraReady = permission?.granted && mode === "camera" && Platform.OS !== "web";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Quét QR check-in</Text>
        {/* Toggle camera / manual */}
        <TouchableOpacity style={s.iconBtn} onPress={() => setMode((m) => (m === "camera" ? "manual" : "camera"))}>
          {mode === "camera" ? <Keyboard size={18} color="#fff" /> : <CameraIcon size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Network badge */}
      <View style={s.body}>
        <View style={s.modeBadge}>
          {isOnline ? <Wifi size={14} color="#16a34a" /> : <WifiOff size={14} color="#ea580c" />}
          <Text style={{ color: isOnline ? "#16a34a" : "#ea580c", fontWeight: "700", marginLeft: 6 }}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
        </View>

        <Text style={s.metaTitle}>{selectedWorkshop.title}</Text>
        <Text style={s.metaSub}>
          Phòng {selectedWorkshop.room} · Bắt đầu {selectedWorkshop.start}
        </Text>

        {/* --- CAMERA MODE --- */}
        {mode === "camera" && Platform.OS !== "web" ? (
          <View style={s.cameraWrap}>
            {!permission ? (
              <Text style={s.hint}>Đang kiểm tra quyền camera...</Text>
            ) : !permission.granted ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                <Text style={s.hint}>Chưa có quyền truy cập camera.</Text>
                <TouchableOpacity style={s.scanBtn} onPress={requestPermission}>
                  <Text style={s.scanTxt}>Cấp quyền camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <CameraView
                  style={s.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={scanning ? undefined : onBarcodeScanned}
                />
                {/* Viewfinder overlay */}
                <View style={s.overlay} pointerEvents="none">
                  <View style={s.finder} />
                </View>
                <Text style={s.scanHint}>{scanning ? "Đang xử lý..." : "Hướng camera vào mã QR trên vé"}</Text>
              </>
            )}
          </View>
        ) : null}

        {/* --- MANUAL / WEB MODE --- */}
        {mode === "manual" || Platform.OS === "web" ? (
          <View style={s.frame}>
            <QrCode size={48} color="#93c5fd" />
            <Text style={s.frameText}>Nhập mã QR để xử lý check-in</Text>
            <TextInput
              value={qrInput}
              onChangeText={setQrInput}
              placeholder="REG-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              autoCorrect={false}
              style={s.input}
              onSubmitEditing={onManualSubmit}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[s.scanBtn, { marginTop: 12, width: "100%" }]}
              onPress={onManualSubmit}
              disabled={scanning}
            >
              <Text style={s.scanTxt}>
                {scanning ? "Đang xử lý..." : isOnline ? "Validate & Check-in" : "Lưu offline"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const FINDER_SIZE = 230;

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
  metaSub: { color: "#cbd5e1", marginTop: 4, fontSize: 12, marginBottom: 16 },
  // Camera
  cameraWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  finder: {
    width: FINDER_SIZE,
    height: FINDER_SIZE,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#60a5fa",
    backgroundColor: "transparent",
  },
  scanHint: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    color: "#fff",
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hint: { color: "#cbd5e1", textAlign: "center", marginTop: 20 },
  // Manual / Web
  frame: {
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
    fontWeight: "600",
    fontSize: 13,
  },
  scanBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  scanTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
