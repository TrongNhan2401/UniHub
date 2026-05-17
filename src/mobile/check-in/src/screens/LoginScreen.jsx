import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Mail, Lock, Eye, EyeOff, QrCode, ChevronRight } from "lucide-react-native";
import { checkinService, tokenStorage } from "../services/api";
import { useCheckin } from "../context/CheckinContext";

function getLoginErrorMessage(error) {
  const apiDetail = error?.response?.data?.detail;
  if (apiDetail) {
    return apiDetail;
  }

  if (!error?.response) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "(fallback theo platform)";
    return `Khong ket noi duoc API. Kiem tra EXPO_PUBLIC_API_URL (${apiUrl}) va dam bao backend dang chay.`;
  }

  return "Dang nhap khong thanh cong. Vui long kiem tra email/mat khau.";
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const { refreshWorkshops } = useCheckin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const response = await checkinService.login({ email, password });
      const token = response?.data?.accessToken;

      if (!token) {
        Alert.alert("Đăng nhập thất bại", "Không nhận được token từ máy chủ.");
        return;
      }

      await tokenStorage.setItem("checkin_token", token);
      await refreshWorkshops();
      navigation.replace("Main");
    } catch (error) {
      const message = getLoginErrorMessage(error);
      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 36 }}>
            <View style={s.logoBox}>
              <QrCode size={34} color="#2563eb" strokeWidth={2} />
            </View>
            <Text style={s.brand}>UniHub</Text>
            <Text style={s.brandSub}>Cổng check-in</Text>
            <Text style={s.desc}>Đăng nhập tài khoản CHECKIN_STAFF để quét mã QR check-in</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Nhân sự check-in</Text>

            {/* Email */}
            <Text style={s.label}>Địa chỉ email</Text>
            <View style={[s.inputRow, email.length > 0 && s.inputActive]}>
              <Mail size={17} color="#94a3b8" strokeWidth={1.8} />
              <TextInput
                style={s.input}
                placeholder="organizer@university.edu"
                placeholderTextColor="#cbd5e1"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <Text style={[s.label, { marginTop: 16 }]}>Mật khẩu</Text>
            <View style={[s.inputRow, password.length > 0 && s.inputActive]}>
              <Lock size={17} color="#94a3b8" strokeWidth={1.8} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPass ? (
                  <EyeOff size={17} color="#64748b" strokeWidth={1.8} />
                ) : (
                  <Eye size={17} color="#64748b" strokeWidth={1.8} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ alignSelf: "flex-end", marginTop: 10 }}>
              <Text style={{ color: "#2563eb", fontSize: 13, fontWeight: "600" }}>Cần hỗ trợ đăng nhập?</Text>
            </TouchableOpacity>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[s.loginBtn, submitting && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {submitting ? "Đang xử lý..." : "Đăng nhập"}
              </Text>
              <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>UniHub Workshop System · v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 40, paddingBottom: 40, justifyContent: "center" },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#2563eb",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  brand: { fontSize: 28, fontWeight: "900", color: "#1e3a8a", letterSpacing: -0.5 },
  brandSub: { fontSize: 14, color: "#2563eb", fontWeight: "600", marginTop: 2 },
  desc: { fontSize: 13, color: "#64748b", marginTop: 6, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 7, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    gap: 10,
  },
  inputActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  input: { flex: 1, height: 48, fontSize: 15, color: "#0f172a" },
  loginBtn: {
    marginTop: 22,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  footer: { textAlign: "center", marginTop: 24, fontSize: 12, color: "#cbd5e1" },
});
