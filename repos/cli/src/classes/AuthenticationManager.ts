import axios from "axios";
import { API_URL, OIDC_CLIENT_ID, OIDC_URL } from "../config";
import { asyncSleep } from "../utils/time";
import { FormBody } from "./FormBody";
import { ConfigurationManager } from "./ConfigurationManager";
import { Debug } from "./Debug";

type AuthPayload = {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: "Bearer";
};

export class AuthenticationManager {
  static #oidcConnector = axios.create({
    baseURL: OIDC_URL,
    headers: {
      "User-Agent": "Iwdil~CLI",
    },
  });

  static async startSignin() {
    Debug.log(`${this.name} - Creating OIDC device auth request.`);
    const { device_code, verification_uri_complete, expires_in } =
      await this.#createOidcDeviceAuthRequest();

    return {
      id: device_code,
      url: verification_uri_complete,
      expiry_date: new Date(Date.now() + expires_in * 1000),
    };
  }

  static async finishSignin(id: string, expiry_date: Date) {
    let response: AuthPayload | null = null;

    while (Date.now() < expiry_date.getTime()) {
      Debug.log(`${this.name} - Polling for data.`);
      const pollResponse = await this.#pollOidcDeviceAuthRequest(id);

      if (!("code" in pollResponse)) {
        Debug.log(`${this.name} - Got credentials.`);

        response = pollResponse;
        break;
      }

      await asyncSleep(2000);
    }

    if (!response) {
      Debug.log(`${this.name} - Timed out`);
      return console.error("Timed out");
    }

    await this.#saveAuthPayload(response);
  }

  static async obtainAccessToken(): Promise<string> {
    // Read token expiry date from config
    const tokenExpiry = await ConfigurationManager.get(
      "authentication:token_expiry",
    );

    // Exit if not logged in
    if (!tokenExpiry) {
      Debug.log(`${this.name} - Token expiry not found in config.`);
      console.log("Missing credentials, please run 'iwdil login'.");
      process.exit();
    }

    // If token is not past expiry date
    if (Date.now() < new Date(tokenExpiry as string).getTime()) {
      Debug.log(`${this.name} - Token not expired, attempting reuse.`);

      const accessToken = await ConfigurationManager.get(
        "authentication:access_token",
      );

      // Return access token, if present
      if (accessToken) {
        Debug.log(`${this.name} - Returning saved token.`);
        return accessToken as string;
      }
    }

    Debug.log(`${this.name} - Trying to refresh token`);

    // Try to read refresh token
    const refreshToken = await ConfigurationManager.get(
      "authentication:refresh_token",
    );

    if (!refreshToken) {
      Debug.log(`${this.name} - Failed to read refresh token from config.`);
      console.log("Missing credentials, please run 'iwdil login'.");
      process.exit();
    }

    Debug.log(`${this.name} Refreshing token.`);
    const credentials = await this.#refreshOidcAccessToken(
      refreshToken as string,
    );

    await this.#saveAuthPayload(credentials);

    return credentials.access_token;
  }

  static async #saveAuthPayload(payload: AuthPayload) {
    Debug.log(`${this.name} - Saving credentials.`);

    await ConfigurationManager.set(
      "authentication:access_token",
      payload.access_token,
    );
    await ConfigurationManager.set("authentication:id_token", payload.id_token);
    await ConfigurationManager.set(
      "authentication:refresh_token",
      payload.refresh_token,
    );
    await ConfigurationManager.set(
      "authentication:token_expiry",
      new Date(Date.now() + payload.expires_in * 1000).toISOString(),
    );
  }

  static async #createOidcDeviceAuthRequest(): Promise<{
    device_code: string;
    verification_uri_complete: string;
    expires_in: number;
  }> {
    const form = new FormBody({
      client_id: OIDC_CLIENT_ID,
      scope: [
        "openid",
        "offline_access",
        "profile",
        "api:access",
        "api:admin",
      ].join(" "),
      resource: API_URL,
    });

    const { data } = await this.#oidcConnector.post("/device/auth", form.body, {
      headers: form.headers,
    });

    return data;
  }

  static async #pollOidcDeviceAuthRequest(deviceCode: string): Promise<
    | AuthPayload
    | {
        code: string;
      }
  > {
    const form = new FormBody({
      client_id: OIDC_CLIENT_ID,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: deviceCode,
      resource: API_URL,
    });

    const { data } = await this.#oidcConnector
      .post("/token", form.body, {
        headers: form.headers,
      })
      .catch((e) => e.response);

    return data;
  }

  static async #refreshOidcAccessToken(
    refresh_token: string,
  ): Promise<AuthPayload> {
    const form = new FormBody({
      client_id: OIDC_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refresh_token,
      resource: API_URL,
    });

    const { data } = await this.#oidcConnector
      .post("/token", form.body, {
        headers: form.headers,
      })
      .catch((e) => e.response);

    return data;
  }
}
