import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';



export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {

    const { orderId } = await params;



  // First get the session before using params
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(`/admin-login?callbackUrl=${encodeURIComponent(`/admin-dashboard/orders/${orderId}`)}`);
  }

  if (session.user.role !== 'super_admin') {
    redirect('/auth/error?error=Unauthorized');
  }

  
  let order = null;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/single-order?order_id=${orderId}`,
     
      {
        headers: { Authorization: `Bearer ${session.user.token}` }
      }
    );
    
    order = response.data.data;
    console.log(order);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    redirect('/admin-dashboard/orders');
  }

  if (!order) {
    redirect('/admin-dashboard/orders');
  }

  return (
    <div className="p-4 space-y-6">
      <Button asChild variant="ghost">
        <Link href="/admin-dashboard/orders" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order #{order.id.substring(0, 8)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <Badge 
                    variant={
                      order.orderStatus === 'DELIVERED' ? 'secondary' :
                      order.orderStatus === 'CANCELLED' ? 'destructive' : 'default'
                    }
                    className="mt-1"
                  >
                    {order.orderStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  {/* <p className="text-gray-900 dark:text-white font-bold text-[16px]">{order.user.firstname} {order.user.lastname}</p> */}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge 
                    variant={
                      order.paymentStatus === 'PAID' ? 'secondary' :
                      order.paymentStatus === 'FAILED' ? 'destructive' : 'default'
                    }
                    className="mt-1"
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Placed At</p>
                  <p>{new Date(order.placedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p>{new Date(order.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Tracking Code</p>
                <p>{order.trackingCode || 'Not available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Total */}
        <Card>
          <CardHeader>
            <CardTitle>Order Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.totalAmount + order.discount)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-red-500">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order?.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0">
                <div className="w-20 h-20 bg-muted rounded-md overflow-hidden">
                  <img 
                    src={item.variant?.image || item.Product?.product_image || '/placeholder-product.jpg'} 
                    alt={item.variant?.name || item.Product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.variant?.name || item.Product?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                  {item.variant?.netWeight && (
                    <p className="text-sm text-muted-foreground">
                      {item.variant.netWeight}kg
                    </p>
                  )}
                </div>
                <div className="font-medium">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}