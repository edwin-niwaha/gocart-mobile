import { PRODUCTS } from '@/assets/products';
import { ListHeader } from '@/src/components/list-header';
import { ProductListItem } from '@/src/components/product-list-item';
import {
  FlatList,
  StyleSheet,
  View
} from 'react-native';


const Home = () => {

  return (

    <View>
      <FlatList
        data={PRODUCTS}
        renderItem={({ item }) => <ProductListItem product={item} />}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.flatListColumn}
        style={{ paddingHorizontal: 10, paddingVertical: 5 }}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 20,
  },
  flatListColumn: {
    justifyContent: 'space-between',
  },
});
