import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';

// Stack & Tab navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth & Session Storage Helpers
const TOKEN_KEY = 'cpcb_jwt_token';
const USER_KEY = 'cpcb_auth_user';

export async function saveAuthSession(token: string, user: any) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export async function clearAuthSession() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function bootstrapAsync() {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userJson = await SecureStore.getItemAsync(USER_KEY);
        if (token && userJson) {
          setUserToken(token);
          setCurrentUser(JSON.parse(userJson));
        }
      } catch (e) {
        console.error('Bootstrap session load error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.splashText}>CPCB MedWaste Guard Khamgaon</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f8fafc',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {userToken == null ? (
          // Unauthenticated Flow: Hospital Selection -> Verified Login
          <>
            <Stack.Screen 
              name="HospitalSelect" 
              component={HospitalSelectPlaceholder} 
              options={{ title: 'Khamgaon Hospital Network' }} 
            />
            <Stack.Screen 
              name="Login" 
              component={LoginPlaceholder} 
              options={{ title: 'Staff Credential Sign-In' }} 
            />
          </>
        ) : (
          // Authenticated Role-Based App Shell
          <Stack.Screen 
            name="MainApp" 
            component={MainTabNavigator} 
            options={{ headerShown: false }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#020617' },
        headerTintColor: '#f8fafc',
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardPlaceholder} />
      <Tab.Screen name="Log Waste" component={LogWastePlaceholder} />
      <Tab.Screen name="Audit Trail" component={AuditPlaceholder} />
    </Tab.Navigator>
  );
}

// Minimal native placeholders demonstrating structure
function HospitalSelectPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Khamgaon Healthcare Cluster</Text>
      <Text style={styles.subtitle}>Government Hospital • Dwarka Hospital • Anand Hospital • Hedgewar Rugnalaya • CBWTF</Text>
    </View>
  );
}

function LoginPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Authentication</Text>
      <Text style={styles.subtitle}>Verified server-side with bcrypt password hashing.</Text>
    </View>
  );
}

function DashboardPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CPCB Bio-Medical Dashboard</Text>
      <Text style={styles.subtitle}>Tracking today's waste, 48-hour storage limits, and incineration certificates.</Text>
    </View>
  );
}

function LogWastePlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Waste Bag</Text>
      <Text style={styles.subtitle}>Yellow • Red • Blue • White • Black Category Segregation with Barcode Generation.</Text>
    </View>
  );
}

function AuditPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CPCB Tamper-Evident Ledger</Text>
      <Text style={styles.subtitle}>Cryptographic SHA-256 chain verification of all waste movements.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    color: '#10b981',
    marginTop: 16,
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
