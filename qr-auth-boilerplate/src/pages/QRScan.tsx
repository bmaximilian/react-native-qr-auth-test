import { Container, Text } from 'native-base';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { BarCodeEvent, BarCodeScanner } from 'expo-barcode-scanner';
import { verifyAuthToken } from '../lib/verifyAuthToken';

interface QRScanProps {
    onReceivedAuthToken: (token: string) => void;
}


export function QRScan(props: QRScanProps): JSX.Element {
    const [hasPermission, setHasPermission] = useState<boolean|null>(null);
    const [scanned, setScanned] = useState(false);
    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    async function handleBarcodeScanned({ data }: BarCodeEvent) {
        setScanned(true);
        const response = await verifyAuthToken(data);

        if (response.status >= 400) {
            Alert.alert('', 'Something went wrong when scanning the barcode.', [
                { text: 'OK', onPress: () => setScanned(false) }
            ]);
            return;
        }

        props.onReceivedAuthToken(data);
    }

    if (!hasPermission) {
        const content = hasPermission === false
            ? 'No access to camera'
            : 'Requesting for camera permission';

        return <Text>{content}</Text>;
    }

    return (
        <Container>
            <BarCodeScanner
                onBarCodeScanned={scanned ? () => {} : handleBarcodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
        </Container>
    )
}
