export async function apiFetch<T>(
  url: string,
  errorMessage: string,
  unauthorizedMessage = "Please sign in to continue."
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error(unauthorizedMessage);
  }

  if (!response.ok) {
    throw new Error(`${errorMessage} (${response.status})`);
  }

  return (await response.json()) as T;
}

export function getErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error ? error.message : fallback;
}
