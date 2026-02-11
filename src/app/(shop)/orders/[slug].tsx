import { Stack } from 'expo-router';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';


const OrderDetails = () => {


    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Order Details' }} />

            <Text style={styles.item}>Order Details</Text>
        </View>
    );
};

export default OrderDetails;

const styles: { [key: string]: any } = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    item: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    details: {
        fontSize: 16,
        marginBottom: 16,
    },
    statusBadge: {
        padding: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    statusBadge_Pending: {
        backgroundColor: 'orange',
    },
    statusBadge_Completed: {
        backgroundColor: 'green',
    },
    statusBadge_Shipped: {
        backgroundColor: 'blue',
    },
    statusBadge_InTransit: {
        backgroundColor: 'purple',
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    date: {
        fontSize: 14,
        color: '#555',
        marginTop: 16,
    },
    itemsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        padding: 16,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
    heroImage: {
        width: '50%',
        height: 100,
        borderRadius: 10,
    },
    itemInfo: {},
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemPrice: {
        fontSize: 14,
        marginTop: 4,
    },
});
