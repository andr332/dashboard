import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import history from "./utils/history";
import {getConfig} from "./config";
import {OidcProvider} from '@axa-fr/react-oidc';
import {BrowserRouter} from "react-router-dom";
import Loading from "./components/Loading";
import LoginError from "./components/LoginError";
import {AuthorityConfiguration} from "@axa-fr/react-oidc/dist/vanilla/oidc";
import InstallPage from "./views/Install";
import {ConfigProvider} from "antd";

const config = getConfig();

// Unfortunately Auth0 https://<DOMAIN>/.well-known/openid-configuration doesn't contain end_session_endpoint that
// is required for doing logout. Therefore, we need to hardcode the config for auth
const auth0AuthorityConfig: AuthorityConfiguration = {
    authorization_endpoint: new URL("authorize", config.authority).href,
    token_endpoint: new URL("oauth/token", config.authority).href,
    revocation_endpoint: new URL("oauth/revoke", config.authority).href,
    end_session_endpoint: new URL("v2/logout", config.authority).href,
    userinfo_endpoint: new URL("userinfo", config.authority).href,
} as AuthorityConfiguration

const buildExtras = (config: any) => {
    type Extras = { [key: string]: string }
    let extras: Extras = {};

    if (config.dragQueryParams) {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.forEach((value, key) => {
            extras[key] = value
        });
    }

    if (config.audience) {
        extras.audience = config.audience
    }
    return extras
}

const providerConfig = {
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: window.location.origin + config.redirectURI,
    refresh_time_before_tokens_expiration_in_second: 30,
    silent_redirect_uri: window.location.origin + config.silentRedirectURI,
    scope: config.scopesSupported,
    // disabling service worker
    // service_worker_relative_url:'/OidcServiceWorker.js',
    service_worker_only: false,
    authority_configuration: config.auth0Auth ? auth0AuthorityConfig : undefined,
    extras: buildExtras(config),
    ...(config.clientSecret ? {token_request_extras: {client_secret: config.clientSecret}} : null)
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const loadingComponent = () => <Loading padding="3em" width={50} height={50}/>

const showApp = () => {
    if (window.location.pathname === "/install") {
        // We bypass authentication for pages that do not require auth.
        // E.g., when we just want to show installation steps for public.
        return <InstallPage/>
    }

    return <OidcProvider
        configuration={providerConfig}
        callbackSuccessComponent={loadingComponent}
        authenticatingErrorComponent={LoginError}
        authenticatingComponent={loadingComponent}
        sessionLostComponent={loadingComponent}
        loadingComponent={loadingComponent}
        onSessionLost={() => {
            history.push("/peers")
        }}
    >
        <BrowserRouter>
            <App/>
        </BrowserRouter>
    </OidcProvider>
}

root.render(
    <ConfigProvider
        theme={{
            token: {
                borderRadius: 4,
                colorPrimary: "#1890ff",
                fontFamily: "Arial"
            },
            components: {Badge: {fontSizeSM: 20}},
        }}
    >
        {showApp()}
    </ConfigProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();