import messaging from '@react-native-firebase/messaging';

export async function subscribeCityTopic(city: string) {
    try {
        const topic = `city_${city.toLowerCase().replace(/\s+/g, "_")}`;
        await messaging().subscribeToTopic(topic);
        console.log("Subscribed to topic:", topic);
    } catch (error) {
        console.error("Failed to subscribe city topic:", error);
    }
}

export async function unsubscribeCityTopic(city: string) {
    try {
        const topic = `city_${city.toLowerCase().replace(/\s+/g, "_")}`;
        await messaging().unsubscribeFromTopic(topic);
        console.log("Unsubscribed from topic:", topic);
    } catch (error) {
        console.error("Failed to unsubscribe city topic:", error);
    }
}
