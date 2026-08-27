"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ChartLineData01Icon } from "@hugeicons/core-free-icons";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { LargeSkeleton } from "./UsersChartDialog";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const chartConfig = {
  desktop: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Pending",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// Helper to format month-year from date string
const formatMonthYear = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export function OrdersChart() {
  const { data: clientSession } = useSession();
  const [serverUser, setServerUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(setServerUser)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const user = clientSession?.user || serverUser;

  const { data, isError, error } = useQuery({
    queryKey: ["user-orders-charts"],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/all-order`,
        {
          headers: {
            Authorization: `Bearer ${
              user?.token || localStorage.getItem("token")
            }`,
          },
        }
      );

      const orders = response.data.data as Array<{
        id: string;
        orderStatus: string;
        placedAt: string;
        totalAmount: number;
      }>;

      // Group orders by month and status
      const monthlyData: Record<
        string,
        {
          month: string;
          completed: number;
          pending: number;
          total: number;
        }
      > = {};

      orders.forEach((order) => {
        const monthYear = formatMonthYear(order.placedAt);
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: monthYear,
            completed: 0,
            pending: 0,
            total: 0,
          };
        }

        if (order.orderStatus === "DELIVERED") {
          monthlyData[monthYear].completed += 1;
        } else {
          monthlyData[monthYear].pending += 1;
        }
        monthlyData[monthYear].total += order.totalAmount;
      });

      // Convert to array and sort by date
      return Object.values(monthlyData)
        .sort(
          (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        )
        .slice(-12); // Last 12 months
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <LargeSkeleton />;
  }

  if (isError) {
    return <p>{error?.message || "Error loading order data"}</p>;
  }

  return (
    <Card className="w-full rounded-none border-slate-200 shadow-none">
      <CardHeader>
        <CardTitle className="text-[18px]">Order Activity</CardTitle>
        <CardDescription className="text-[14px]">
          Showing your order statistics by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="completed"
              type="natural"
              fill="url(#fillDesktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            />
            <Area
              dataKey="pending"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Your order trends
              <HugeiconsIcon icon={ChartLineData01Icon} size={15} strokeWidth={1.8} />
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.reduce((sum, month) => sum + month.completed, 0)} completed
              orders
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
