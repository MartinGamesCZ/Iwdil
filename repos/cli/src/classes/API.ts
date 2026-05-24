import axios, { type AxiosRequestConfig } from "axios";
import { AuthenticationManager } from "./AuthenticationManager";
import { API_URL } from "../config";

interface IErrorResponse {
  error: string;
  statusCode: number;
  message: string;
}

export type IResponse<OkType> = IErrorResponse | OkType;

export class API {
  static #connector = axios.create({
    baseURL: API_URL,
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
    endpoint: string,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.get<ResponseType>(endpoint, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${await AuthenticationManager.obtainAccessToken()}`,
      },
    });
  }

  static async rbacPost<BodyType, ResponseType>(
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.post<BodyType, ResponseType>(endpoint, body, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${await AuthenticationManager.obtainAccessToken()}`,
      },
    });
  }

  static async rbacPut<BodyType, ResponseType>(
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.put<BodyType, ResponseType>(endpoint, body, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${await AuthenticationManager.obtainAccessToken()}`,
      },
    });
  }

  static async rbacDelete<ResponseType>(
    endpoint: string,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.delete<ResponseType>(endpoint, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${await AuthenticationManager.obtainAccessToken()}`,
      },
    });
  }

  static async rbacPatch<BodyType, ResponseType>(
    endpoint: string,
    body: BodyType,
    params?: AxiosRequestConfig,
  ): Promise<IResponse<ResponseType>> {
    return await this.patch<BodyType, ResponseType>(endpoint, body, {
      ...params,
      headers: {
        ...params?.headers,
        Authorization: `Bearer ${await AuthenticationManager.obtainAccessToken()}`,
      },
    });
  }
}
