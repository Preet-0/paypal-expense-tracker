
const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

type PayPalAccessToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are missing");
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `PayPal authentication failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as PayPalAccessToken;

  return data.access_token;
}

export async function paypalRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    requestId?: string;
  } = {}
): Promise<T> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_BASE_URL}${path}`,
    {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(options.requestId
          ? { "PayPal-Request-Id": options.requestId }
          : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      "PayPal API error:",
      response.status,
      errorBody
    );

    throw new Error(
      `PayPal request failed with status ${response.status}`
    );
  }

  return (await response.json()) as T;
}
