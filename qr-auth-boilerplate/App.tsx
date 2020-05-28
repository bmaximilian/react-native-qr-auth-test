import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Container, Text } from 'native-base';
import { AsyncStorage } from 'react-native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Home } from './src/pages/Home';
import { QRScan } from './src/pages/QRScan';
import { WebViewPage } from './src/pages/WebView';
import { verifyAuthToken } from './src/lib/verifyAuthToken';

declare var GLOBAL: any;
GLOBAL.XMLHttpRequest = GLOBAL.originalXMLHttpRequest || GLOBAL.XMLHttpRequest;

const Stack = createStackNavigator();

export default function App() {
    const [ready, setReady] = useState(false);
    const [authToken, setAuthToken] = useState<string|null>(null);

    useEffect(() => {
        Font.loadAsync({
            Roboto: require('native-base/Fonts/Roboto.ttf'),
            Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
            ...Ionicons.font,
        })
            .then(async () => {
                const token = await AsyncStorage.getItem('qr-auth-boilerplate:auth-token')
                if (!token) return

                const verifyResponse = await verifyAuthToken(token);
                if (verifyResponse.status < 400) {
                    setAuthToken(token);
                }
            })
            .then(() => setReady(true));
    }, []);

    async function handleReceivedAuthToken(token: string): Promise<void> {
        await AsyncStorage.setItem('qr-auth-boilerplate:auth-token', token);
        setAuthToken(token);
    }

    const isAuthenticated = authToken !== null;

    if (!ready) {
        return (
            <Container>
                <Text>Preparing App</Text>
            </Container>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {
                    isAuthenticated ? (
                        <>
                            <Stack.Screen
                                name="WebView"
                                options={{ title: '' }}
                            >
                                {props => <WebViewPage {...props} token={authToken as string} />}
                            </Stack.Screen>
                        </>
                    ): <>
                        <Stack.Screen
                            name="Home"
                            component={Home}
                            options={{ title: '' }}
                        />
                        <Stack.Screen
                        name="QRScan"
                        options={{ title: 'QR' }}
                        >
                        {props => <QRScan {...props} onReceivedAuthToken={handleReceivedAuthToken} />}
                        </Stack.Screen>
                    </>
                }
            </Stack.Navigator>
        </NavigationContainer>
    );
}
