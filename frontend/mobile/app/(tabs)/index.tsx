import { StyleSheet, Text, View } from 'react-native';

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>A DJAL</Text>
      <Text style={styles.text}>
        Votre marché agricole est prêt.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
