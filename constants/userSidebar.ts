import type { IconSvgElement } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  ShoppingBasket01Icon,
  FavouriteIcon,
  PackageIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";

export interface UserSideBarType {
  path: string;
  icon?: IconSvgElement;
  name: string;
  dynamicPath?: string;
}

export const UserSideBar: UserSideBarType[] = [
  { path: "", name: "Overview", icon: DashboardSquare01Icon },
  { path: "products", name: "Products", icon: ShoppingBasket01Icon },
  { path: "wishlists", name: "Wishlist", icon: FavouriteIcon },
  { path: "orders", name: "Orders", icon: PackageIcon },
  // { path: "addresses", name: "Address", icon: Location01Icon },
];
