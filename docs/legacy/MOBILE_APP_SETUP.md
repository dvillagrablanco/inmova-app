# 📱 INMOVA MOBILE APP - SETUP GUIDE

**Stack**: React Native + Expo  
**Plataformas**: iOS + Android  
**Estado**: Base configurada ✅

---

## 🏗️ ARQUITECTURA

```
mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/            # Bottom tabs navigation
│   │   ├── index.tsx      # Dashboard
│   │   ├── properties.tsx
│   │   ├── matches.tsx
│   │   └── profile.tsx
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx
├── components/
│   ├── ui/                # Reusable UI components
│   ├── property/
│   ├── matching/
│   └── common/
├── lib/
│   ├── api-client.ts      # API wrapper
│   ├── auth.ts            # Auth context
│   ├── storage.ts         # AsyncStorage wrapper
│   └── push-notifications.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useProperties.ts
│   └── usePushNotifications.ts
├── constants/
│   ├── Colors.ts
│   └── Config.ts
├── app.json               # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 INSTALACIÓN

### Prerrequisitos

```bash
# Node.js 18+
node --version

# Expo CLI
npm install -g expo-cli

# iOS (solo macOS)
# - Xcode 14+
# - CocoaPods

# Android
# - Android Studio
# - JDK 11+
```

### Setup Inicial

```bash
# Crear proyecto Expo
npx create-expo-app@latest inmova-mobile --template tabs

cd inmova-mobile

# Instalar dependencias
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
npm install expo-secure-store
npm install expo-notifications
npm install expo-camera
npm install expo-image-picker
npm install expo-file-system
npm install axios
npm install @tanstack/react-query
npm install zustand
npm install react-hook-form
npm install zod

# Instalar Expo Dev Client (para testing nativo)
npx expo install expo-dev-client
```

---

## ⚙️ CONFIGURACIÓN

### app.json

```json
{
  "expo": {
    "name": "Inmova",
    "slug": "inmova-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1e40af"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.inmovaapp.mobile",
      "infoPlist": {
        "NSCameraUsageDescription": "Inmova necesita acceso a la cámara para tomar fotos de propiedades e incidencias",
        "NSPhotoLibraryUsageDescription": "Inmova necesita acceso a tus fotos para adjuntar imágenes",
        "NSUserTrackingUsageDescription": "Inmova usa analytics para mejorar la experiencia"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1e40af"
      },
      "package": "com.inmovaapp.mobile",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-secure-store",
      "expo-notifications",
      [
        "expo-camera",
        {
          "cameraPermission": "Permitir acceso a la cámara para fotos de propiedades"
        }
      ]
    ],
    "extra": {
      "apiUrl": process.env.API_URL || "https://inmovaapp.com/api",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## 🔐 AUTENTICACIÓN

### lib/auth.ts

```typescript
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useState, useEffect } from 'react';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const savedUser = await SecureStore.getItemAsync(USER_KEY);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 📱 PUSH NOTIFICATIONS

### lib/push-notifications.ts

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    alert('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1e40af',
    });
  }

  return token;
}

export async function sendPushTokenToServer(token: string, authToken: string) {
  await fetch(`${process.env.API_URL}/v1/push/register-mobile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
}
```

---

## 🎨 UI COMPONENTS

### components/ui/Button.tsx

```typescript
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#1e40af',
  },
  secondary: {
    backgroundColor: '#64748b',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## 🚀 BUILD & DEPLOY

### Development

```bash
# Start Expo Dev Server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on physical device
# Scan QR code with Expo Go app
```

### Production Builds (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 📊 FEATURES IMPLEMENTADAS

### ✅ Core Features
- [x] Autenticación (login/logout)
- [x] Secure storage de tokens
- [x] Push notifications nativas
- [x] Navigation (tabs + stack)
- [x] API client con auth

### 🚧 En Desarrollo (Post-Sprint 5)
- [ ] Gestión de propiedades
- [ ] Matching de inquilinos
- [ ] Reportar incidencias con cámara
- [ ] Chat en tiempo real
- [ ] Offline sync
- [ ] Biometric auth

---

## 🔧 TROUBLESHOOTING

### iOS Build Fails

```bash
# Clear cache
cd ios && pod deintegrate && pod install
cd .. && npx expo prebuild --clean

# Rebuild
eas build --platform ios --clear-cache
```

### Android Build Fails

```bash
# Clear Gradle cache
cd android && ./gradlew clean
cd .. && npx expo prebuild --clean

# Rebuild
eas build --platform android --clear-cache
```

### Push Notifications Not Working

```bash
# iOS: Check provisioning profile has push capability
# Android: Check google-services.json is present

# Test push token
npx expo push:android:upload --api-key YOUR_KEY
```

---

## 📱 NEXT STEPS

1. **Implementar Screens**:
   - Properties list
   - Property detail
   - Matches
   - Incidents with camera

2. **Offline Sync**:
   - React Query + Persistent cache
   - Background sync

3. **Biometric Auth**:
   - Face ID / Touch ID
   - Fingerprint (Android)

4. **App Store Submission**:
   - Screenshots
   - App Store description
   - Privacy policy
   - Terms of service

---

**Stack**: React Native 0.73 + Expo SDK 50  
**Deployment**: EAS Build + EAS Submit  
**Monitoring**: Sentry (ya integrado en web)

¿Listo para implementar las screens principales? 📱
