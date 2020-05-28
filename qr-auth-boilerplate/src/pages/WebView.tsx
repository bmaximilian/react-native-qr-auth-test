import { Container } from 'native-base';
import React from 'react';
import { WebView } from 'react-native-webview';

interface WebViewPageProps {
    token: string;
}

export function WebViewPage(props: WebViewPageProps): JSX.Element {
    const INJECTED_JAVASCRIPT = `
    const meta = document.createElement('meta');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
    meta.setAttribute('name', 'viewport');
    document.getElementsByTagName('head')[0].appendChild(meta);
  `;

    return (
        <Container>
            <WebView
                source={{ uri: `http://192.168.1.236:3000/qr-code?token=${props.token}` }}
                bounces={false}
                cacheMode="LOAD_CACHE_ELSE_NETWORK"
                injectedJavaScript={INJECTED_JAVASCRIPT}
                scalesPageToFit
                scrollEnabled
                allowsFullscreenVideo
                allowsBackForwardNavigationGestures
                cacheEnabled
                sharedCookiesEnabled
                allowFileAccessFromFileURLs
            />
        </Container>
    )
}
