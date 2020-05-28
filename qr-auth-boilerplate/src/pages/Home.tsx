import { Button, Container, Text } from 'native-base';
import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

interface HomeProps {
    navigation: StackNavigationProp<any>;
}

export function Home(props: HomeProps): JSX.Element {
    return (
        <Container>
            <Text>You are not logged in</Text>
            <Button onPress={() => props.navigation.push('QRScan')}>
                <Text>Scan QR-Code to log in</Text>
            </Button>
        </Container>
    )
}
