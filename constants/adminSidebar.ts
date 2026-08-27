import type { IconSvgElement } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserMultipleIcon,
  ShoppingBasket01Icon,
  Agreement01Icon,
  ShoppingBag01Icon,
  CustomerService01Icon,
  WarehouseIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";

export interface AdminSideBarType {
  path: string;
  icon?: IconSvgElement;
  name: string;
}

export const AdminSideBar: AdminSideBarType[] = [
  { path: "", name: "Overview", icon: DashboardSquare01Icon },
  { path: "users", name: "Users", icon: UserMultipleIcon },
  { path: "products", name: "Products", icon: ShoppingBasket01Icon },
  { path: "consent", name: "Consents", icon: Agreement01Icon },
  { path: "orders", name: "Orders", icon: ShoppingBag01Icon },
  { path: "agents", name: "Fulfillment agents", icon: CustomerService01Icon },
  // { path: "inventory", name: "Inventory", icon: Layers01Icon },
  // { path: "warehouse", name: "Warehouse", icon: WarehouseIcon },
];
