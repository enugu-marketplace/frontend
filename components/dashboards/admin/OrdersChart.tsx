
"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartLineData01Icon } from "@hugeicons/core-free-icons";

interface OrdersChartProps {
  orders: any[];
  products: any[];
}

export default function OrdersChart({ orders, products }: OrdersChartProps) {
  // Process orders by month
  const processOrderData = () => {
    const monthlyData: Record<string, { completed: number; pending: number }> = {};
    
    // Initialize all months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      monthlyData[month] = { completed: 0, pending: 0 };
    });

    // Process orders
    orders.forEach(order => {
      const date = new Date(order.placedAt);
      const month = months[date.getMonth()];
      
      if (order.orderStatus === 'DELIVERED') {
        monthlyData[month].completed += 1;
      } else {
        monthlyData[month].pending += 1;
      }
    });

    return months.map(month => ({
      month,
      completed: monthlyData[month].completed,
      pending: monthlyData[month].pending,
      total: monthlyData[month].completed + monthlyData[month].pending
    }));
  };

  const chartData = processOrderData();

  return (
    <Card className="mb-6 md:w-[70%] text-[14px] w-full">
      <CardHeader>
        <CardTitle className="text-[18px]">Orders</CardTitle>
        <CardDescription className="text-[14px]">
          Order statistics by month
        </CardDescription>
      </CardHeader>
      <CardContent >
        <AreaChart
          width={400}
          height={300}
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area 
            type="monotone" 
            dataKey="completed" 
            stackId="1" 
            stroke="#8884d8" 
            fill="#8884d8" 
          />
          <Area 
            type="monotone" 
            dataKey="pending" 
            stackId="1" 
            stroke="#82ca9d" 
            fill="#82ca9d" 
          />
        </AreaChart>
      </CardContent>
      <CardFooter>
        <div className="flex w-[80%] items-start gap-2 text-[13px]">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Order trends overview
              <HugeiconsIcon icon={ChartLineData01Icon} size={15} strokeWidth={1.8} />
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}