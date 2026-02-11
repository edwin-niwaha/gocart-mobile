import { CATEGORIES } from '@/assets/categories';
import { PRODUCTS } from '@/assets/products';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const Category = () => {
    const { slug } = useLocalSearchParams<{ slug: string }>();

    const category = CATEGORIES.find(category => category.slug === slug);

    if (!category) return <Redirect href="/404" />;

    const products = PRODUCTS.filter(product => product.category.slug === slug);

    return (
        <View>
            <Text>Category</Text>
        </View>
    );
}

export default Category;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    categoryImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        borderRadius: 8,
        marginBottom: 16,
    },
    categoryName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    productsList: {
        flexGrow: 1,
    },
    productRow: {
        justifyContent: 'space-between',
    },
    productContainer: {
        flex: 1,
        margin: 8,
    },
    productImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
        borderRadius: 8,
    },
    productTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
    },
    productPrice: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
});
