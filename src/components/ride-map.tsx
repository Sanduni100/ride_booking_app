import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

type Coordinates = { latitude: number; longitude: number };

type RideMapProps = { pickupCoordinates: Coordinates | null };

const defaultRegion = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export default function RideMap({ pickupCoordinates }: RideMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={defaultRegion}
      region={pickupCoordinates ? { ...pickupCoordinates, latitudeDelta: 0.045, longitudeDelta: 0.045 } : undefined}
      showsUserLocation={Boolean(pickupCoordinates)}
      showsCompass={false}
      toolbarEnabled={false}>
      <Marker coordinate={pickupCoordinates ?? defaultRegion} title="Pickup area" pinColor="#E66C3B" />
    </MapView>
  );
}