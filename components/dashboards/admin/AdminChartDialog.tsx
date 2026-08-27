"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart,
  Area
} from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartLineData01Icon } from "@hugeicons/core-free-icons";

// COLORS
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6"
};

// RADIAN for pie chart labels
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// 1. System Overview Pie Chart
export function SystemOverviewChart({ 
  totalUsers, 
  totalOrders, 
  totalProducts 
}: {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
}) {
  const data = [
    { name: "Users", value: totalUsers },
    { name: "Products", value: totalProducts },
    { name: "Orders", value: totalOrders },
  ];

  const COLORS_PIE = [COLORS.primary, COLORS.secondary, COLORS.success];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">System Overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value}`, `${data.find(d => d.value === value)?.name}`]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 2. Monthly Orders Bar Chart
export function MonthlyOrdersChart({ orders }: { orders: any[] }) {
  const processOrderData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({
      month,
      orders: orders.filter(o => months[new Date(o.placedAt).getMonth()] === month).length
    }));
    return monthlyData;
  };

  const chartData = processOrderData();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Monthly Orders</CardTitle>
          <HugeiconsIcon icon={ChartLineData01Icon} size={18} strokeWidth={1.8} className="text-brand-700" />
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              contentStyle={{
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
            />
            <Bar 
              dataKey="orders" 
              name="Orders" 
              fill={COLORS.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 3. Order Status Composition Pie Chart
export function OrderStatusChart({ orders }: { orders: any[] }) {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS_STATUS = [COLORS.success, COLORS.warning, COLORS.danger, COLORS.info];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Order Status</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 4. Order Trends Area Chart (Improved)
export function OrderTrendsChart({ orders }: { orders: any[] }) {
  const processOrderData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({
      month,
      completed: orders.filter(o => 
        months[new Date(o.placedAt).getMonth()] === month && 
        o.orderStatus === 'DELIVERED'
      ).length,
      pending: orders.filter(o => 
        months[new Date(o.placedAt).getMonth()] === month && 
        o.orderStatus !== 'DELIVERED'
      ).length
    }));
    return monthlyData;
  };

  const chartData = processOrderData();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Trends</CardTitle>
          <HugeiconsIcon icon={ChartLineData01Icon} size={18} strokeWidth={1.8} className="text-brand-700" />
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              contentStyle={{
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="completed" 
              name="Completed" 
              stroke={COLORS.success} 
              fillOpacity={1} 
              fill="url(#colorCompleted)" 
            />
            <Area 
              type="monotone" 
              dataKey="pending" 
              name="Pending" 
              stroke={COLORS.warning} 
              fillOpacity={1} 
              fill="url(#colorPending)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}