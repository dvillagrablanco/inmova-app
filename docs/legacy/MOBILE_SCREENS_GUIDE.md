# 📱 MOBILE APP - SCREENS COMPLETAS

**Actualización Sprint 7**  
Implementación de todas las screens principales de la app mobile.

---

## 🏗️ ESTRUCTURA DE NAVEGACIÓN

```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx ✅ (ya implementado)
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx (Dashboard)
│   │   ├── properties/
│   │   │   ├── index.tsx (Lista)
│   │   │   ├── [id].tsx (Detalle)
│   │   │   └── new.tsx (Crear)
│   │   ├── matches/
│   │   │   ├── index.tsx (Lista)
│   │   │   └── [id].tsx (Detalle)
│   │   ├── incidents/
│   │   │   ├── index.tsx (Lista)
│   │   │   └── new.tsx (Reportar con cámara)
│   │   └── profile.tsx
│   └── chat/[id].tsx (Chat screen)
```

---

## 📱 SCREENS IMPLEMENTADAS

### 1. Properties List (`app/(tabs)/properties/index.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export default function PropertiesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.get('/properties'),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderProperty = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => router.push(`/properties/${item.id}`)}
    >
      <Image 
        source={{ uri: item.images?.[0]?.url || '/placeholder.jpg' }}
        style={styles.propertyImage}
      />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle}>
          {item.direccion || item.address}
        </Text>
        <Text style={styles.propertyCity}>
          {item.ciudad || item.city}
        </Text>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyPrice}>
            €{item.precio || item.price}/mes
          </Text>
          <Text style={styles.propertyRooms}>
            {item.habitaciones || item.rooms} hab • {item.banos || item.bathrooms} baños
          </Text>
        </View>
        <View style={styles.propertyFeatures}>
          {item.tieneParking && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>🅿️ Parking</Text>
            </View>
          )}
          {item.tieneAscensor && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>🛗 Ascensor</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.properties || []}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  propertyRooms: {
    fontSize: 14,
    color: '#666',
  },
  propertyFeatures: {
    flexDirection: 'row',
    gap: 8,
  },
  featureBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#374151',
  },
});
```

---

### 2. Property Detail (`app/(tabs)/properties/[id].tsx`)

```typescript
import { View, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => apiClient.get(`/properties/${id}`),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <ScrollView horizontal pagingEnabled style={styles.imageGallery}>
        {property?.images?.map((img: any, index: number) => (
          <Image
            key={index}
            source={{ uri: img.url }}
            style={styles.propertyImage}
          />
        ))}
      </ScrollView>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{property?.direccion}</Text>
        <Text style={styles.city}>{property?.ciudad}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>€{property?.precio}/mes</Text>
          <Text style={styles.status}>
            {property?.estado === 'AVAILABLE' ? '✅ Disponible' : '❌ No disponible'}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Habitaciones</Text>
            <Text style={styles.detailValue}>{property?.habitaciones}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Baños</Text>
            <Text style={styles.detailValue}>{property?.banos}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Superficie</Text>
            <Text style={styles.detailValue}>{property?.superficie}m²</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{property?.descripcion}</Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.featuresGrid}>
            {property?.tieneParking && (
              <View style={styles.feature}>
                <Text>🅿️ Parking</Text>
              </View>
            )}
            {property?.tieneAscensor && (
              <View style={styles.feature}>
                <Text>🛗 Ascensor</Text>
              </View>
            )}
            {property?.tieneJardin && (
              <View style={styles.feature}>
                <Text>🌳 Jardín</Text>
              </View>
            )}
            {property?.tienePiscina && (
              <View style={styles.feature}>
                <Text>🏊 Piscina</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Contactar"
            onPress={() => router.push(`/chat/${property?.companyId}`)}
          />
          <Button
            title="Ver Tour Virtual"
            variant="outline"
            onPress={() => {/* Open virtual tour */}}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageGallery: {
    height: 300,
  },
  propertyImage: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  city: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  status: {
    fontSize: 14,
    color: '#10b981',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  feature: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
});
```

---

### 3. Report Incident with Camera (`app/(tabs)/incidents/new.tsx`)

```typescript
import { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';

export default function ReportIncidentScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const takePicture = async (camera: any) => {
    if (camera) {
      const photo = await camera.takePictureAsync();
      setPhotos([...photos, photo.uri]);
      setShowCamera(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...uris]);
    }
  };

  const submitIncident = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Describe el problema');
      return;
    }

    try {
      // Upload photos
      const uploadedUrls = await Promise.all(
        photos.map(async (uri) => {
          const formData = new FormData();
          formData.append('file', {
            uri,
            type: 'image/jpeg',
            name: 'photo.jpg',
          } as any);

          const response = await apiClient.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          return response.url;
        })
      );

      // Create incident
      await apiClient.post('/maintenance/classify', {
        description,
        photos: uploadedUrls,
      });

      Alert.alert('Éxito', 'Incidencia reportada correctamente');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo reportar la incidencia');
    }
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
          <Text>Necesitamos permisos para acceder a la cámara</Text>
          <Button title="Conceder permisos" onPress={requestPermission} />
        </View>
      );
    }

    return (
      <CameraView style={styles.camera} facing="back">
        {(camera) => (
          <View style={styles.cameraControls}>
            <Button
              title="❌ Cancelar"
              onPress={() => setShowCamera(false)}
              variant="secondary"
            />
            <Button
              title="📸 Tomar Foto"
              onPress={() => takePicture(camera)}
            />
          </View>
        )}
      </CameraView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reportar Incidencia</Text>

        <TextInput
          style={styles.textarea}
          placeholder="Describe el problema..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <View style={styles.photosGrid}>
            {photos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.photo} />
            ))}
          </View>

          <View style={styles.photoButtons}>
            <Button
              title="📷 Cámara"
              onPress={() => setShowCamera(true)}
              variant="outline"
            />
            <Button
              title="🖼️ Galería"
              onPress={pickImage}
              variant="outline"
            />
          </View>
        </View>

        <Button
          title="Enviar Reporte"
          onPress={submitIncident}
          disabled={!description.trim()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    minHeight: 120,
  },
  photosSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 40,
  },
});
```

---

### 4. Tenant Matches (`app/(tabs)/matches/index.tsx`)

```typescript
import { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api-client';

export default function MatchesScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => apiClient.get('/matching/my-matches'),
  });

  const renderMatch = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/matches/${item.id}`)}
    >
      <View style={styles.matchHeader}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Match</Text>
          <Text style={styles.scoreValue}>{item.matchScore}%</Text>
        </View>
      </View>

      <Image
        source={{ uri: item.property.images?.[0]?.url }}
        style={styles.matchImage}
      />

      <View style={styles.matchInfo}>
        <Text style={styles.matchTitle}>{item.property.direccion}</Text>
        <Text style={styles.matchCity}>{item.property.ciudad}</Text>
        <Text style={styles.matchPrice}>€{item.property.precio}/mes</Text>

        <View style={styles.matchReasons}>
          <Text style={styles.reasonsTitle}>Por qué es un buen match:</Text>
          {item.pros?.slice(0, 2).map((pro: string, index: number) => (
            <Text key={index} style={styles.reason}>
              ✅ {pro}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.matches || []}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  scoreContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  matchImage: {
    width: '100%',
    height: 200,
  },
  matchInfo: {
    padding: 16,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  matchPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  matchReasons: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  reasonsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  reason: {
    fontSize: 13,
    color: '#166534',
    marginBottom: 4,
  },
});
```

---

## 📦 DEPENDENCIAS ADICIONALES

```bash
# Camera
npx expo install expo-camera

# Image Picker
npx expo install expo-image-picker

# Dimensions
# Ya incluido en react-native

# React Query (ya instalado)
```

---

## 🎨 COMPONENTES REUTILIZABLES

Todos los screens usan componentes de `@/components/ui/`:
- `Button` ✅
- `Input` (crear)
- `Card` (crear)
- `Badge` (crear)

---

## 🔗 INTEGRACIÓN CON API

Todos los screens usan `@/lib/api-client.ts` que debe configurarse con:

```typescript
// lib/api-client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://inmovaapp.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { apiClient };
```

---

## ✅ SCREENS COMPLETADAS

- [x] Properties List
- [x] Property Detail
- [x] Report Incident (con cámara)
- [x] Matches List
- [x] Login (Sprint 5)

## 🚧 PENDIENTES (Opcional)

- [ ] Chat screen integrado
- [ ] Property search filters
- [ ] User profile edit
- [ ] Push notifications settings

---

**Stack**: React Native + Expo + React Query + Axios  
**Status**: Core screens completadas ✅
