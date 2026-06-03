"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { UserWithRelations } from "@/types/index";
import { useEffect, useState } from "react";
import { EditUserDialog } from "./users/EditUserDialog";
import { DeleteUserDialog } from "./users/DeleteUserDialog";
import { AddUnitDialog } from "./users/AddUnitDialog";

interface UserDetailsProps {
  userData: UserWithRelations;
  token: string;
}

export function UserDetails({ userData, token }: UserDetailsProps) {
  const router = useRouter();
  const userId = userData.id;
  const [currentUser] = useState(userData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            params: {
              user_id: userId
            },
            timeout: 10000
          }
        );
        return response.data?.data || response.data;
      } catch (error: unknown) {
        console.error("API Error:", error);
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as any).response === "object" &&
          (error as any).response !== null
        ) {
          const response = (error as any).response;
          if (response.status === 401) {
            toast.error("Session expired. Please login again.");
            router.push("/auth/signin");
          } else if (response.status === 404) {
            // Return initial data if 404 occurs
            return userData;
          }
        }
        throw error;
      }
    },
    initialData: userData,
    enabled: !!token,
    refetchOnWindowFocus: false,
    retry: false
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  // Debugging logs
  useEffect(() => {
    console.log('Current user data:', user);
  }, [user]);

  useEffect(() => {
    if (isError) {
      console.log('Error state:', { isError, error });
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading user data...</span>
      </div>
    );
  }

  if (isError && !user) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="text-red-600 font-medium">Error loading user</div>
        <div className="text-red-500 text-sm mt-1">
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
        <Button
          variant="outline"
          className="mt-4 hover:bg-red-50 hover:text-red-600"
          onClick={() => router.refresh()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Fallback to initial data if error occurs but we have initial data
  const displayUser = isError ? userData : user;

  const handleDeleteSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>User Information</CardTitle>
            <div className="flex space-x-2">
               <EditUserDialog 
                user={currentUser} 
                token={token} 
                onSuccess={refetch} 
              />
              {/* <AddUnitDialog user={displayUser} triggerLabel="Add Unit" /> */}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="font-medium">
                {displayUser.firstname} {displayUser.lastname}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Employee ID</p>
              <p className="font-mono">{displayUser.employee_id || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">PSN</p>
              <p className="font-mono">{displayUser.verification_id || "N/A"}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-blue-600 hover:underline">{displayUser.email}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p>{displayUser.phone || "N/A"}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Government Entity</p>
              <p className="capitalize">{displayUser.government_entity || "N/A"}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <Badge variant={displayUser.isActive ? "default" : "destructive"}>
                {displayUser.isActive ? "Active" : "Suspended"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p>{formatDate(displayUser.createdAt)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p>{formatDate(displayUser.updatedAt)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Role</p>
              <Badge variant="secondary" className="capitalize">
                {displayUser.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information Card */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Monthly Salary</p>
              <p className="font-medium text-green-700">
                {formatCurrency(displayUser.salary_per_month || 0)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Loan Unit</p>
              <p className="font-medium">
                {formatCurrency(displayUser.loan_unit || 0)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Loan Collected</p>
              <p className="font-medium text-red-700">
                {formatCurrency(displayUser.loan_amount_collected || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Card */}
      {displayUser.addresses?.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {displayUser.addresses.map((address: unknown) => {
              // Type guard for address
              if (
                typeof address === "object" &&
                address !== null &&
                "id" in address &&
                "label" in address &&
                "isDefault" in address &&
                "street" in address &&
                "city" in address &&
                "state" in address &&
                "country" in address &&
                "zipCode" in address
              ) {
                const typedAddress = address as {
                  id: string | number;
                  label: string;
                  isDefault: boolean;
                  street: string;
                  city: string;
                  state: string;
                  country: string;
                  zipCode: string;
                };
                return (
                  <div key={typedAddress.id} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Label</p>
                        <p className="capitalize">{typedAddress.label}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Default Address</p>
                        <Badge variant={typedAddress.isDefault ? "default" : "outline"}>
                          {typedAddress.isDefault ? "Yes" : "No"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Street</p>
                        <p>{typedAddress.street}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">City</p>
                        <p>{typedAddress.city}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">State</p>
                        <p>{typedAddress.state}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Country</p>
                        <p>{typedAddress.country}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Zip Code</p>
                        <p>{typedAddress.zipCode}</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                  </div>
                );
              }
              return null;
            })}
          </CardContent>
        </Card>
      )}

      {/* Orders Card */}
      {displayUser.orders?.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Order History ({displayUser.orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {displayUser.orders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Order ID</p>
                      <p className="font-mono text-sm">{order.id}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p>{formatDate(order.placedAt)}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p>{formatCurrency(order.totalAmount)}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="flex items-center">
                        <Badge
                          variant={
                            order.orderStatus === "DELIVERED"
                              ? "default"
                              : order.orderStatus === "CANCELLED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {order.orderStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Link href={`/admin-dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Order
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wishlist Card */}
      {displayUser.wishlist?.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Wishlist ({displayUser.wishlist.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayUser.wishlist.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <p className="font-medium">Product ID: {item.productId}</p>
                  <p className="text-sm text-gray-500">
                    Added: {formatDate(item.addedAt)}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Product
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone Card */}
      <Card className="border-red-200">
        <CardHeader className="border-b border-red-200 bg-red-50">
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Reset Password</p>
                <p className="text-sm text-gray-500">
                  Send password reset link to user's email
                </p>
              </div>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                Reset Password
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {displayUser.isActive ? "Suspend Account" : "Activate Account"}
                </p>
                <p className="text-sm text-gray-500">
                  {displayUser.isActive
                    ? "Temporarily disable this user's access"
                    : "Reactivate this user's account"}
                </p>
              </div>
              <Button 
                variant="outline" 
                className={displayUser.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
              >
                {displayUser.isActive ? "Suspend" : "Activate"}
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-gray-500">
                  Permanently delete this user account
                </p>
              </div>
               <Button 
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <DeleteUserDialog
        userId={userId}
        userName={`${currentUser.firstname} ${currentUser.lastname}`}
        token={token}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}