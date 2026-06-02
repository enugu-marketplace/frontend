export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  trackingCode: string | null;
  placedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  couponId: string | null;
  discount: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  addedAt: string;
}

export interface UserWithRelations {
  id: string;
  firstname: string;
  lastname: string;
  email: string | null;
  phone: string;
  level: string;
  employee_id: string;
  government_entity: string;
  salary_per_month: number;
  verification_id: string ;
  loan_unit: number;
  loan_amount_collected: number;
  loan_extension?: number;
  max_extension_limit?: number;
  is_address_set: boolean;
  password: string | null;
  otp: string | null;
  role: string;
  profile_image: string | null;
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  orders: Order[];
  cart_items: any[];
  wishlist: WishlistItem[];
  status?: string;

}