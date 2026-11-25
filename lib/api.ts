export const authApi = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(responseText || 'Request failed');
    }

    return responseText ? JSON.parse(responseText) : {};
  } catch (error: any) {
    console.error(`Auth API error (${endpoint}):`, error);
    throw error;
  }
};
/**
 * Forwards a login-step request to the backend and passes its status code and
 * message straight back to the browser, so users see the real reason
 * (e.g. "We could not send your verification code right now") instead of a
 * generic "Authentication failed".
 */
export async function proxyAuthRequest(endpoint: string, data: unknown, fallbackMessage: string) {
  const { NextResponse } = await import('next/server');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    const text = await response.text();
    let body: any = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    if (!response.ok) {
      console.error(`Auth API error (${endpoint}): ${response.status}`, body?.message || text.slice(0, 300));
      const headers: Record<string, string> = {};
      const retryAfter = response.headers.get('retry-after');
      if (retryAfter) headers['Retry-After'] = retryAfter;
      return NextResponse.json(
        {
          success: false,
          error: body?.error || fallbackMessage,
          message: body?.message || body?.reason || fallbackMessage,
          retryAfterSeconds: retryAfter ? Number(retryAfter) : undefined,
        },
        { status: response.status, headers }
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error(`Auth API network error (${endpoint}):`, error);
    return NextResponse.json(
      { success: false, error: fallbackMessage, message: 'Unable to reach the server. Check your internet connection and try again.' },
      { status: 503 }
    );
  }
}
