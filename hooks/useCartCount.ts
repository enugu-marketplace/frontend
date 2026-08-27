"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface CartLine {
  quantity: number;
}

/**
 * Single source of truth for the cart badge.
 *
 * Every place that changes the cart invalidates the ["cart"] key, which matches
 * ["cart", token] by prefix, so the badge updates immediately rather than
 * waiting for the poll.
 */
export function useCartCount(token?: string) {
  const { data } = useQuery({
    queryKey: ["cart", token],
    queryFn: async () => {
      if (!token) return { data: [] as CartLine[] };

      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (error) {
        console.error("Cart fetch error:", error);
        return { data: [] as CartLine[] };
      }
    },
    enabled: !!token,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  return (
    data?.data?.reduce((sum: number, item: CartLine) => sum + (item.quantity || 0), 0) || 0
  );
}
