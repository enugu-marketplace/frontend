
'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Clock, Truck, HelpCircle, QrCode } from 'lucide-react';

interface Props {
  order: any; // you can reuse your Order type
  qrCodeUrl: string | null;
  loanExtension?: number;
  showExport?: boolean; // toggle whether to show export button
}

export default function OrderConfirmationContent({ order, qrCodeUrl, loanExtension = 0, showExport = true }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const formatCurrency = (amount: number, currency: string = 'NGN') =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);

  const exportToPDF = async () => {
    if (!contentRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`order-confirmation-${order?.id.split('-')[0]}.pdf`);
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      {showExport && (
        <div className="flex justify-end mb-6">
          <Button onClick={exportToPDF} disabled={isGeneratingPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? 'Exporting...' : 'Export as PDF'}
          </Button>
        </div>
      )}

      <div ref={contentRef} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-end mb-6">
        {/* <Button 
          onClick={exportToPDF} 
          disabled={isGeneratingPDF}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGeneratingPDF ? 'Exporting...' : 'Export as PDF'}
        </Button> */}
      </div>

      {/* Content to be exported */}
      <div ref={contentRef} className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-green-50 dark:bg-green-900/20 p-6 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Thank you for your purchase!
          </p>

          {loanExtension > 0 && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-amber-900">
                Note: {formatCurrency(loanExtension, order.currency)} of this has been charged against next month&apos;s allocation.
              </p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-500 dark:text-gray-400">Order Number</h3>
              <p className="text-gray-900 dark:text-white">#{order.id.split('-')[0].toUpperCase()}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-500 dark:text-gray-400">Date Placed</h3>
              <p className="text-gray-900 dark:text-white">{formatDate(order.placedAt)}</p>
              
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-500 dark:text-gray-400">Total Amount</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(order.totalAmount, order.currency)}
              </p>
            </div>
            <h3 className="font-medium  text-gray-500 dark:text-gray-400">Customer Name:</h3>
            <p className="text-gray-900 text-[30px] dark:text-white font-bold">{order.user.firstname} {order.user.lastname}</p>
            
          </div>
          <div className=" ">
              
              
            </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 text-center">
            Delivery QR Code
          </h3>
          <div className="text-center">
            {qrCodeUrl ? (
              <div className="inline-block border rounded-lg p-4">
                <img 
                  src={qrCodeUrl} 
                  alt="Delivery QR Code" 
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Present this QR code to the delivery agent for verification
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">QR Code loading...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item:any) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden">
                    <Image
                      src={item.Product?.product_image || '/placeholder-product.jpg'}
                      alt={item.Product?.name || 'Product image'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.Product?.name || 'Unknown Product'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Quantity: {item.quantity}
                    </p>
                    {item.Product?.isPerishable !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.Product.isPerishable
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {item.Product.isPerishable ? "Perishable" : "Non-Perishable"}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.total, order.currency)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.unitPrice, order.currency)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${order.orderStatus === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                {order.orderStatus === 'PENDING' ? (
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {order.orderStatus === 'PENDING' ? 'Processing' : 'Shipped'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.orderStatus === 'PENDING' 
                    ? 'Your order is being prepared' 
                    : 'Your order is on the way'}
                </p>
              </div>
            </div>
            {order.trackingCode && (
              <Button variant="outline" size="sm">
                Track Order
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Your order has been successfully received and is being processed.
          </p>
        </div>

        {/* Order Total */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount, order.currency)}</span>
          </div>
        </div>

        {/* Delivery Instructions */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Delivery Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>Bring this confirmation with you on delivery day</li>
            <li>Show the QR code to the delivery agent for scanning</li>
            <li>The agent will verify your identity and confirm delivery</li>
            <li>You may receive an OTP for final verification</li>
          </ol>
        </div>

        {/* Customer Information */}
        {order.user && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Name:</strong> {order.user.firstname} {order.user.lastname}</p>
                <p><strong>Email:</strong> {order.user.email}</p>
              </div>
              <div>
                <p><strong>Phone:</strong> {order.user.phone}</p>
                <p><strong>Order Status:</strong> {order.orderStatus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/employee-dashboard/products">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-gray-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Need Help?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contact our customer support for assistance with your order.
              </p>
            </div>
          </div>
          <Button variant="link" className="mt-2 pl-0 text-primary" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
