import { StyleSheet, Text, View } from 'react-native';

export default function RideMap() {
  return (
    <View style={styles.map}>
      <View style={styles.roadHorizontal} />
      <View style={styles.roadVertical} />
      <View style={styles.park}><Text style={styles.parkLabel}>V I H A R A M A H A D E V I</Text></View>
      <View style={styles.pin}><Text style={styles.pinText}>R</Text></View>
      <Text style={styles.caption}>CITY MAP · COLOMBO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, overflow: 'hidden', backgroundColor: '#E7ECE3' },
  roadHorizontal: { position: 'absolute', width: '120%', height: 22, backgroundColor: '#FAFAF5', top: 105, left: -20, transform: [{ rotate: '-9deg' }] },
  roadVertical: { position: 'absolute', width: 18, height: '130%', backgroundColor: '#FAFAF5', top: -20, left: '62%', transform: [{ rotate: '19deg' }] },
  park: { position: 'absolute', left: '11%', top: 63, width: 105, height: 65, backgroundColor: '#D3E2D0', borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  parkLabel: { color: '#7E997B', fontSize: 6, fontWeight: '700' },
  pin: { position: 'absolute', left: '53%', top: 77, width: 34, height: 34, borderRadius: 17, backgroundColor: '#E66C3B', borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  pinText: { color: '#FFFFFF', fontWeight: '900', fontSize: 11 },
  caption: { position: 'absolute', bottom: 12, left: 13, color: '#68736A', fontSize: 8, fontWeight: '800', letterSpacing: 1.3 },
});