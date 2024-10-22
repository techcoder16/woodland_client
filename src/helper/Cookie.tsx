import Cookies from 'js-cookie';

// Function to get a cookie by key
export async function DEFAULT_COOKIE_GETTER(key: string): Promise<string | null> {
  return Cookies.get(key) || null;
}

// Function to set a cookie
export async function DEFAULT_COOKIE_SETTER(
  key: string,
  data: string,
  isExpired: boolean = false,
  expires: number | Date = 1 // Default expiration is 1 day
): Promise<void> {
  const options = isExpired ? { expires, secure: true } : { expires };
  Cookies.set(key, data, options);
}

// Function to delete a cookie
export async function DEFAULT_COOKIE_DELETE(key: string): Promise<void> {
  Cookies.remove(key);
}
