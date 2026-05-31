import axios, { AxiosRequestConfig } from "axios";
import { AuthenticationManager } from "./AuthenticationManager";
import { EventSource } from "eventsource";

interface IErrorResponse {
  error: string;
  statusCode: number;
  message: string;
}

export type IResponse<OkType> = IErrorResponse | OkType;

export class API {
  static #connector = axios.create({
    baseURL: "http://localhost:3001",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  static async get<ResponseType>(
    endpoint: string,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return this.#connector
      .get<IResponse<ResponseType>>(endpoint, params)
      .then((response) => response.data)
      .catch((error: any) => error.response?.data || error);
  }

  static async post<BodyType, ResponseType>(
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return this.#connector
      .post<IResponse<ResponseType>>(endpoint, body, params)
      .then((response) => response.data)
      .catch((error: any) => error.response?.data || error);
  }

  static async put<BodyType, ResponseType>(
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return this.#connector
      .put<IResponse<ResponseType>>(endpoint, body, params)
      .then((response) => response.data)
      .catch((error: any) => error.response?.data || error);
  }

  static async delete<ResponseType>(
    endpoint: string,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return this.#connector
      .delete<IResponse<ResponseType>>(endpoint, params)
      .then((response) => response.data)
      .catch((error: any) => error.response?.data || error);
  }

  static async patch<BodyType, ResponseType>(
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return this.#connector
      .patch<IResponse<ResponseType>>(endpoint, body, params)
      .then((response) => response.data)
      .catch((error: any) => error.response?.data || error);
  }

  static async rbacGet<ResponseType>(
    authManager: AuthenticationManager,
    endpoint: string,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.get<ResponseType>(endpoint, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${authManager.apiAccessToken}`,
      },
    });
  }

  static async rbacPost<BodyType, ResponseType>(
    authManager: AuthenticationManager,
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.post<BodyType, ResponseType>(endpoint, body, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${authManager.apiAccessToken}`,
      },
    });
  }

  static async rbacPut<BodyType, ResponseType>(
    authManager: AuthenticationManager,
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.put<BodyType, ResponseType>(endpoint, body, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${authManager.apiAccessToken}`,
      },
    });
  }

  static async rbacDelete<ResponseType>(
    authManager: AuthenticationManager,
    endpoint: string,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.delete<ResponseType>(endpoint, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${authManager.apiAccessToken}`,
      },
    });
  }

  static async rbacPatch<BodyType, ResponseType>(
    authManager: AuthenticationManager,
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.patch<BodyType, ResponseType>(endpoint, body, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${authManager.apiAccessToken}`,
      },
    });
  }

  static rbacSse(
    authManager: AuthenticationManager,
    endpoint: string,
  ): EventSource {
    return new EventSource(`${this.#connector.defaults.baseURL}${endpoint}`, {
      fetch: (url, init: any) =>
        fetch(url, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${authManager.apiAccessToken}`,
          },
        }),
    });
  }
}
