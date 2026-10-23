import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RideMap from '@/components/ride-map';
import {
  createRide,
  findNearbyDrivers,
  getRide,
  type RideStatus,
} from '@/services/ride-api';

type Coordinates = { latitude: number; longitude: number };

const statusSteps: { key: RideStatus; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'driver_arriving', label: 'Driver arriving' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

export default function HomeScreen() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupCoordinates, setPickupCoordinates] = useState<Coordinates | null>(null);
  const [fieldError, setFieldError] = useState('');
  const [message, setMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);
  const isDemo = !process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (!rideId || isDemo || rideStatus === 'completed' || rideStatus === 'cancelled') return;
    const timer = setInterval(() => {
      getRide(rideId)
        .then((ride) => setRideStatus(ride.status))
        .catch(() => setMessage('Connection lost. Ride updates will resume automatically.'));
    }, 5000);
    return () => clearInterval(timer);
  }, [isDemo, rideId, rideStatus]);

  useEffect(() => {
    if (!isDemo || !rideId || !rideStatus || rideStatus === 'completed') return;
    const timer = setTimeout(() => {
      const currentIndex = statusSteps.findIndex((step) => step.key === rideStatus);
      if (currentIndex >= 0 && currentIndex < statusSteps.length - 1) {
        setRideStatus(statusSteps[currentIndex + 1].key);
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [isDemo, rideId, rideStatus]);

  async function useCurrentLocation() {
    setIsLocating(true);
    setMessage('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setMessage('Location access is off. Enter your pickup address or allow access in settings.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setPickupCoordinates(coordinates);
      const [address] = Platform.OS === 'web' ? [] : await Location.reverseGeocodeAsync(coordinates);
      const label = [address?.name, address?.street, address?.city].filter(Boolean).join(', ');
      setPickup(label || `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`);
      setFieldError('');
    } catch {
      setMessage('Could not get your location. Enter your pickup address instead.');
    } finally {
      setIsLocating(false);
    }
  }

  function validateLocations() {
    if (!pickup.trim() || !destination.trim()) {
      setFieldError('Add both a pickup and destination to continue.');
      return false;
    }
    setFieldError('');
    return true;
  }

  async function searchDrivers() {
    if (!validateLocations()) return;
    setIsSearching(true);
    setMessage('');
    try {
      if (isDemo) {
        setNearbyCount(4);
      } else {
        const result = await findNearbyDrivers(pickup, pickupCoordinates);
        setNearbyCount(result.count);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not find nearby drivers.');
    } finally {
      setIsSearching(false);
    }
  }

  async function bookRide() {
    if (!validateLocations()) return;
    setIsBooking(true);
    setMessage('');
    try {
      const ride = isDemo
        ? { id: `demo-${Date.now()}`, status: 'requested' as const }
        : await createRide({ pickup, destination, pickupCoordinates });
      setRideId(ride.id);
      setRideStatus(ride.status);
      setNearbyCount(null);
      setMessage('Ride requested successfully. We will keep you updated on your driver.');
      if (Platform.OS !== 'web') {
        Alert.alert('Ride requested', 'Your ride request has been sent. We will keep you updated.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not book your ride. Please try again.');
    } finally {
      setIsBooking(false);
    }
  }

  const activeStep = statusSteps.findIndex((step) => step.key === rideStatus);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>RIDEBOOK / CITY</Text>
            <Text style={styles.title}>Where to?</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>JD</Text></View>
        </View>

        <View style={styles.mapFrame}>
          <RideMap pickupCoordinates={pickupCoordinates} />
          <View style={styles.mapTopTag}><View style={styles.liveDot} /><Text style={styles.mapTopText}>LIVE AREA</Text></View>
          <Pressable style={styles.locationButton} onPress={useCurrentLocation} disabled={isLocating} accessibilityLabel="Use current GPS location">
            {isLocating ? <ActivityIndicator color="#202822" /> : <Text style={styles.locationButtonText}>◎</Text>}
          </Pressable>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Plan your ride</Text>
            <Text style={styles.etaLabel}>FAST · RELIABLE · LOCAL</Text>
          </View>

          <View style={styles.routeInputs}>
            <View style={styles.routeRail}>
              <View style={styles.pickupDot} /><View style={styles.routeLine} /><View style={styles.destinationDot} />
            </View>
            <View style={styles.inputStack}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>PICKUP</Text>
                <TextInput
                  value={pickup}
                  onChangeText={(value) => { setPickup(value); setPickupCoordinates(null); setFieldError(''); }}
                  placeholder="Your pickup location"
                  placeholderTextColor="#8D948E"
                  style={styles.input}
                  accessibilityLabel="Pickup location"
                  returnKeyType="next"
                />
                <Pressable onPress={useCurrentLocation} style={styles.gpsButton} disabled={isLocating}>
                  <Text style={styles.gpsText}>{isLocating ? 'LOCATING...' : 'USE GPS'}</Text>
                </Pressable>
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>DROP-OFF</Text>
                <TextInput
                  value={destination}
                  onChangeText={(value) => { setDestination(value); setFieldError(''); }}
                  placeholder="Where are you going?"
                  placeholderTextColor="#8D948E"
                  style={styles.input}
                  accessibilityLabel="Destination"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {fieldError ? <Text accessibilityRole="alert" style={styles.errorText}>{fieldError}</Text> : null}
          {message ? <Text accessibilityRole="alert" style={styles.messageText}>{message}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={searchDrivers} disabled={isSearching || isBooking}>
              {isSearching ? <ActivityIndicator color="#26352C" /> : <Text style={styles.secondaryButtonText}>Find nearby drivers</Text>}
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={bookRide} disabled={isBooking || isSearching}>
              {isBooking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Book this ride <Text style={styles.buttonArrow}>→</Text></Text>}
            </Pressable>
          </View>

          {nearbyCount !== null ? (
            <View style={styles.driverResult}>
              <View style={styles.driverIcon}><Text style={styles.driverIconText}>+</Text></View>
              <View style={styles.driverCopy}>
                <Text style={styles.driverTitle}>{nearbyCount} drivers nearby</Text>
                <Text style={styles.driverSubtext}>{nearbyCount ? 'Ready to pick you up' : 'Try another pickup location'}</Text>
              </View>
              <Text style={styles.driverTime}>{nearbyCount ? '~4 min' : '--'}</Text>
            </View>
          ) : null}
        </View>

        {rideStatus ? (
          <View style={styles.statusSection}>
            <View style={styles.statusHeader}>
              <View><Text style={styles.statusEyebrow}>YOUR RIDE</Text><Text style={styles.statusTitle}>{statusSteps.find((step) => step.key === rideStatus)?.label ?? 'Ride update'}</Text></View>
              <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{isDemo ? 'DEMO' : 'LIVE'}</Text></View>
            </View>
            <View style={styles.progressTrack}>
              {statusSteps.map((step, index) => (
                <View style={styles.progressItem} key={step.key}>
                  <View style={[styles.progressDot, index <= activeStep && styles.progressDotActive]}>
                    {index < activeStep ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={[styles.progressLabel, index === activeStep && styles.progressLabelActive]}>{step.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {isDemo ? <Text style={styles.demoNote}>DEMO MODE · Set EXPO_PUBLIC_API_URL to connect your ride service</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F7F2' },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 28, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { height: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: '#68736A', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#202822', fontSize: 29, fontWeight: '700', marginTop: 3 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DCE8D8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#37563D', fontSize: 12, fontWeight: '800' },
  mapFrame: { height: 216, borderRadius: 8, overflow: 'hidden', backgroundColor: '#E5EAE0', position: 'relative' },
  mapTopTag: { position: 'absolute', top: 13, left: 13, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#65A66A' },
  mapTopText: { color: '#3F5143', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  locationButton: { position: 'absolute', right: 13, bottom: 13, width: 40, height: 40, borderRadius: 5, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  locationButtonText: { color: '#26352C', fontSize: 24 },
  formSection: { paddingTop: 23 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { color: '#202822', fontSize: 18, fontWeight: '700' },
  etaLabel: { color: '#879087', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  routeInputs: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 7, borderWidth: 1, borderColor: '#E7E9E2', minHeight: 153, paddingLeft: 17, paddingVertical: 15 },
  routeRail: { width: 22, alignItems: 'center', paddingTop: 5, paddingBottom: 8 },
  pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5D8D60', borderWidth: 2, borderColor: '#DCE8D8' },
  routeLine: { width: 1, flex: 1, minHeight: 37, backgroundColor: '#D4D9D0', marginVertical: 3 },
  destinationDot: { width: 10, height: 10, backgroundColor: '#E66C3B', borderWidth: 2, borderColor: '#F8E3D9' },
  inputStack: { flex: 1, paddingRight: 14 },
  inputBlock: { minHeight: 59, justifyContent: 'center', position: 'relative' },
  inputLabel: { color: '#788278', fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2 },
  input: { color: '#202822', fontSize: 14, fontWeight: '600', paddingVertical: 2, paddingRight: 70 },
  gpsButton: { position: 'absolute', right: 0, bottom: 13, paddingVertical: 6, paddingLeft: 8 },
  gpsText: { color: '#547D58', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  inputDivider: { height: 1, backgroundColor: '#ECEEE8', marginVertical: 2 },
  errorText: { color: '#B5483A', fontSize: 12, marginTop: 9 },
  messageText: { color: '#8B5635', fontSize: 12, lineHeight: 17, marginTop: 9 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  secondaryButton: { minHeight: 48, flex: 1, borderRadius: 5, borderWidth: 1, borderColor: '#CDD5CB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F2' },
  secondaryButtonText: { color: '#344639', fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 48, flex: 1.15, borderRadius: 5, backgroundColor: '#26352C', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  buttonArrow: { fontSize: 17 },
  driverResult: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2E9', marginTop: 12, padding: 12, borderRadius: 5 },
  driverIcon: { width: 31, height: 31, borderRadius: 16, backgroundColor: '#D7E4D2', alignItems: 'center', justifyContent: 'center' },
  driverIconText: { color: '#4C744F', fontSize: 19, fontWeight: '500' },
  driverCopy: { marginLeft: 10, flex: 1 },
  driverTitle: { color: '#2B3A2E', fontSize: 12, fontWeight: '700' },
  driverSubtext: { color: '#768177', fontSize: 10, marginTop: 2 },
  driverTime: { color: '#405644', fontSize: 11, fontWeight: '800' },
  statusSection: { borderTopWidth: 1, borderColor: '#E3E6DE', marginTop: 22, paddingTop: 18 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusEyebrow: { color: '#7A867B', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  statusTitle: { color: '#202822', fontSize: 17, fontWeight: '700', marginTop: 3 },
  statusBadge: { backgroundColor: '#E3EADF', paddingVertical: 6, paddingHorizontal: 9, borderRadius: 3 },
  statusBadgeText: { color: '#4A674D', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  progressTrack: { marginTop: 17, gap: 9 },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 20 },
  progressDot: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: '#C7CEC5', backgroundColor: '#F7F7F2', alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { borderColor: '#5D8D60', backgroundColor: '#5D8D60' },
  checkmark: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  progressLabel: { color: '#8B938B', fontSize: 11, fontWeight: '500' },
  progressLabelActive: { color: '#29382E', fontWeight: '700' },
  demoNote: { color: '#8C948A', fontSize: 8, fontWeight: '700', letterSpacing: 0.6, textAlign: 'center', marginTop: 22 },
});
