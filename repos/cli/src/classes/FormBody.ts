export class FormBody {
  #data: Record<string, string | number | boolean>;

  constructor(data: Record<string, string | number | boolean>) {
    this.#data = data;
  }

  get headers() {
    return {
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  get body() {
    const kvPairs = Object.entries(this.#data);
    const joinedKvPairs = kvPairs.map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
    );

    return joinedKvPairs.join("&");
  }
}
