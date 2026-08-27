"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { useSession } from "next-auth/react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface IOrderChart {
  pending: number[];
  processing: number[];
  delivered: number[];
}

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
    title: {
      display: true,
      text: "Your Weekly Order Activity",
    },
  },
};

const getLastWeekDays = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toLocaleDateString("en-US", { weekday: "short" }));
  }
  return days;
};

const labels = getLastWeekDays();

export const LargeSkeleton = () => {
  return (
    <Skeleton
      className="w-full rounded-lg"
      height={340}
      variant="rectangular"
      animation="wave"
    />
  );
};

export default function OrderActivityChart() {
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
  const {
    data: chartData,
    error,
    isError,
  } = useQuery<IOrderChart>({
    queryKey: ["line-chart-user-orders"],
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
        orderStatus: string;
        placedAt: string;
      }>;

      // Initialize daily counts
      const dailyCounts: Record<
        string,
        {
          pending: number;
          processing: number;
          delivered: number;
        }
      > = {};

      // Initialize last 7 days
      const last7Days = Array(7)
        .fill(0)
        .map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split("T")[0]; // YYYY-MM-DD
        })
        .reverse();

      // Initialize empty counts for each day
      last7Days.forEach((day) => {
        dailyCounts[day] = { pending: 0, processing: 0, delivered: 0 };
      });

      // Count orders by status for each day
      orders.forEach((order) => {
        const orderDate = order.placedAt.split("T")[0];
        if (dailyCounts[orderDate]) {
          if (order.orderStatus === "PENDING") {
            dailyCounts[orderDate].pending += 1;
          } else if (order.orderStatus === "PROCESSING") {
            dailyCounts[orderDate].processing += 1;
          } else if (order.orderStatus === "DELIVERED") {
            dailyCounts[orderDate].delivered += 1;
          }
        }
      });

      // Convert to arrays for chart
      return {
        pending: last7Days.map((day) => dailyCounts[day].pending),
        processing: last7Days.map((day) => dailyCounts[day].processing),
        delivered: last7Days.map((day) => dailyCounts[day].delivered),
      };
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <LargeSkeleton />;
  }

  if (isError) {
    return <p>{error?.message || "Error loading order data"}</p>;
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Pending",
        data: chartData?.pending || [],
        borderColor: "#FF6634",
        backgroundColor: "#D53500",
        tension: 0.1,
      },
      {
        label: "Processing",
        data: chartData?.processing || [],
        borderColor: "#FFA500",
        backgroundColor: "#FF8C00",
        tension: 0.1,
      },
      {
        label: "Delivered",
        data: chartData?.delivered || [],
        borderColor: "#359671",
        backgroundColor: "#00FF00",
        tension: 0.1,
      },
    ],
  };

  return (
    <Card className="w-full rounded-none border-slate-200 px-4 py-4 shadow-none">
      <div className="mx-auto">
        <h2 className="text-[18px] font-medium mb-4">
          Your Order Activity Last Week
        </h2>
        <Line options={options} data={data} />
      </div>
    </Card>
  );
}
