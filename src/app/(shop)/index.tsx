import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { PRODUCTS } from '../../../assets/products';

const styles = StyleSheet.create({
  flatListContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingBottom: 12,
    color: '#2563eb',
  },
});

const Home = () => {
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={PRODUCTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.price}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default Home;
