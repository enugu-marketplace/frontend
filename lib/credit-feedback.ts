import axios from "axios";

interface ProfilePayload {
  loan_unit?: number;
  loan_extension?: number;
  max_extension_limit?: number;
}

interface ProfileResponse {
  data?: ProfilePayload;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product?: {
    basePrice?: number;
  };
}

interface CartResponse {
  data?: CartItem[];
}

export interface CreditSnapshot {
  loanUnit: number;
  loanExtension: number;
  extensionRemaining: number;
  maxExtensionLimit: number;
  status: "purchasing" | "extension" | "exhausted";
  message: string;
}

export interface ExtensionDecision {
  requiresExtension: boolean;
  insufficientCredit: boolean;
  loanUnit: number;
  extensionRemaining: number;
  availableCredit: number;
  cartTotal: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

export async function fetchCreditSnapshot(token: string): Promise<CreditSnapshot | null> {
  if (!token) return null;

  try {
    const response = await axios.get<ProfileResponse>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const profile = response.data?.data || {};
    const loanUnit = Number(profile.loan_unit || 0);
    const loanExtension = Number(profile.loan_extension || 0);
    const maxExtensionLimit = Number(profile.max_extension_limit || 0);
    const extensionRemaining = Math.max(0, maxExtensionLimit - loanExtension);

    if (loanUnit > 0) {
      return {
        loanUnit,
        loanExtension,
        extensionRemaining,
        maxExtensionLimit,
        status: "purchasing",
        message: `Purchasing unit remaining: ${formatCurrency(loanUnit)}.`,
      };
    }

    if (extensionRemaining > 0) {
      return {
        loanUnit,
        loanExtension,
        extensionRemaining,
        maxExtensionLimit,
        status: "extension",
        message: `Purchasing unit exhausted. Extension buffer available: ${formatCurrency(extensionRemaining)}.`,
      };
    }

    return {
      loanUnit,
      loanExtension,
      extensionRemaining,
      maxExtensionLimit,
      status: "exhausted",
      message: "Purchasing unit and extension buffer are exhausted.",
    };
  } catch {
    return null;
  }
}

export async function evaluateCartExtensionDecision(token: string): Promise<ExtensionDecision | null> {
  if (!token) return null;

  try {
    const [profileRes, cartRes] = await Promise.all([
      axios.get<ProfileResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get<CartResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const profile = profileRes.data?.data || {};
    const cartItems = cartRes.data?.data || [];

    const loanUnit = Number(profile.loan_unit || 0);
    const loanExtension = Number(profile.loan_extension || 0);
    const maxExtensionLimit = Number(profile.max_extension_limit || 0);
    const extensionRemaining = Math.max(0, maxExtensionLimit - loanExtension);
    const availableCredit = Math.max(0, loanUnit + extensionRemaining);

    const cartTotal = cartItems.reduce((sum, item) => {
      const unitPrice = Number(item.product?.basePrice || 0);
      return sum + unitPrice * Number(item.quantity || 0);
    }, 0);

    return {
      requiresExtension: cartTotal > loanUnit && cartTotal <= availableCredit,
      insufficientCredit: cartTotal > availableCredit,
      loanUnit,
      extensionRemaining,
      availableCredit,
      cartTotal,
    };
  } catch {
    return null;
  }
}

export async function removeLatestCartItemByProductId(token: string, productId: string): Promise<boolean> {
  if (!token || !productId) return false;

  try {
    const cartRes = await axios.get<CartResponse>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const cartItems = cartRes.data?.data || [];
    const candidate = [...cartItems].reverse().find((item) => item.productId === productId);

    if (!candidate?.id) return false;

    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart/remove-from-cart/${candidate.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return true;
  } catch {
    return false;
  }
}
