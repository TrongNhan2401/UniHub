import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, TouchableOpacity } from "react-native";
import { LayoutDashboard, RefreshCw, ScanLine } from "lucide-react-native";
import LoginScreen from "./screens/LoginScreen";
import ScanScreen from "./screens/ScanScreen";
import ResultScreen from "./screens/ResultScreen";
import OfflineSyncScreen from "./screens/OfflineSyncScreen";
import DashboardScreen from "./screens/DashboardScreen";
import { CheckinProvider } from "./context/CheckinContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  { name: "Dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { name: "Scan", label: "Scan", Icon: ScanLine },
  { name: "Sync", label: "Sync", Icon: RefreshCw },
];

function CustomTabBar({ state, navigation }) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#fff",
        paddingBottom: 10,
        paddingTop: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const { label, Icon } = TAB_ITEMS[index];
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: "center", gap: 4 }}
          >
            <Icon size={22} color={active ? "#2563eb" : "#94a3b8"} strokeWidth={active ? 2.5 : 1.8} />
            <Text
              style={{
                fontSize: 11,
                color: active ? "#2563eb" : "#94a3b8",
                fontWeight: active ? "700" : "400",
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Sync" component={OfflineSyncScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <CheckinProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CheckinProvider>
  );
}
