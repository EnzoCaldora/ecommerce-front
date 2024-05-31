import {OAuthResponseType} from "@okta/okta-auth-js";

export default {

  oidc: {
    clientId: '0oahf4vvfvRXQ2Gdk5d7',
    issuer: 'https://dev-46423607.okta.com/oauth2/default',
    redirectUri: 'http://localhost:4200/login/callback',
    scopes: ['openid', 'profile', 'email'],
    pkce: true

  }

}
