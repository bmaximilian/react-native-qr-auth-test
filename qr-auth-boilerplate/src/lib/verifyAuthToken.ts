import { getUniqueId } from 'react-native-device-info';

export function verifyAuthToken(token: string): Promise<Response> {
    return fetch('http://192.168.1.236:3000/api/v1/qr-code/verify', {
        method: 'POST',
        body: JSON.stringify({ code: token, deviceId: getUniqueId() }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
