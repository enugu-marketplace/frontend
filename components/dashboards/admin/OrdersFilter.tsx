// components/dashboards/admin/orders/OrdersFilter.tsx
'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/types/order';

interface OrdersFilterProps {
  orders: Order[];
  onFilterChange: (filteredOrders: Order[]) => void;
  onSelectionChange?: (selection: { year: string; month: string }) => void;
}

const CYCLE_START_YEAR = 2026;
const CYCLE_START_MONTH = 4; // April (1-12)
const CYCLE_START_DAY = 21;

const getOrderCycleYearMonth = (placedAt: string): { year: string; month: string } | null => {
  if (typeof placedAt !== 'string' || !placedAt.trim()) {
    return null;
  }

  const fullDateMatch = placedAt.match(/^(\d{4})-(\d{2})-(\d{2})/);

  let year: number;
  let monthIndex: number;
  let day: number;

  if (fullDateMatch) {
    year = Number(fullDateMatch[1]);
    monthIndex = Number(fullDateMatch[2]) - 1;
    day = Number(fullDateMatch[3]);
  } else {
    const parsed = new Date(placedAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    year = parsed.getUTCFullYear();
    monthIndex = parsed.getUTCMonth();
    day = parsed.getUTCDate();
  }

  const shouldApplyCycle =
    year > CYCLE_START_YEAR ||
    (year === CYCLE_START_YEAR && monthIndex + 1 > CYCLE_START_MONTH) ||
    (year === CYCLE_START_YEAR && monthIndex + 1 === CYCLE_START_MONTH && day >= CYCLE_START_DAY);

  // Apply payroll cycle only from April->May boundary onward.
  if (shouldApplyCycle && day >= 21) {
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }

  return {
    year: String(year),
    month: String(monthIndex + 1).padStart(2, '0'),
  };
};

export default function OrdersFilter({ orders, onFilterChange, onSelectionChange }: OrdersFilterProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<{ value: string; label: string }[]>([]);

  // Extract available years from orders
  useEffect(() => {
    const years = new Set<number>();
    orders.forEach(order => {
      const parsed = getOrderCycleYearMonth(order.placedAt);
      if (!parsed) {
        return;
      }

      const year = Number(parsed.year);
      if (year >= 2025) { // Starting from 2025 as per your requirement
        years.add(year);
      }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a); // Descending order
    setAvailableYears(sortedYears);
  }, [orders]);

  // Update available months when year changes
  useEffect(() => {
    if (selectedYear && selectedYear !== 'all') {
      const monthsInYear = new Set<number>();
      orders.forEach(order => {
        const parsed = getOrderCycleYearMonth(order.placedAt);
        if (!parsed) {
          return;
        }

        if (parsed.year === selectedYear) {
          monthsInYear.add(Number(parsed.month) - 1); // 0-11
        }
      });

      const monthOptions = Array.from(monthsInYear)
        .sort((a, b) => a - b)
        .map(month => ({
          value: (month + 1).toString().padStart(2, '0'),
          label: new Date(2000, month).toLocaleString('default', { month: 'long' })
        }));

      setAvailableMonths(monthOptions);
      setSelectedMonth('all'); // Reset month when year changes
    } else {
      setAvailableMonths([]);
      setSelectedMonth('all');
    }
  }, [selectedYear, orders]);

  // Apply filters when year or month changes
  useEffect(() => {
    let filtered = orders;

    if (selectedYear && selectedYear !== 'all') {
      filtered = filtered.filter(order => {
        const parsed = getOrderCycleYearMonth(order.placedAt);
        return parsed?.year === selectedYear;
      });
    }

    if (selectedMonth && selectedMonth !== 'all') {
      filtered = filtered.filter(order => {
        const parsed = getOrderCycleYearMonth(order.placedAt);
        return parsed?.month === selectedMonth;
      });
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      filtered = filtered.filter(order => {
        const fullName = `${order.user?.firstname ?? ''} ${order.user?.lastname ?? ''}`.trim().toLowerCase();
        const orderId = String(order.id ?? '').toLowerCase();
        const shortOrderId = orderId.slice(0, 8);
        const phone = String(order.user?.phone ?? '').toLowerCase();
        const userId = String(order.userId ?? '').toLowerCase();
        const status = String(order.orderStatus ?? '').toLowerCase();

        return (
          fullName.includes(normalizedSearch) ||
          orderId.includes(normalizedSearch) ||
          shortOrderId.includes(normalizedSearch) ||
          phone.includes(normalizedSearch) ||
          userId.includes(normalizedSearch) ||
          status.includes(normalizedSearch)
        );
      });
    }

    onFilterChange(filtered);
  }, [selectedYear, selectedMonth, searchTerm, orders, onFilterChange]);

  useEffect(() => {
    onSelectionChange?.({ year: selectedYear, month: selectedMonth });
  }, [selectedYear, selectedMonth, onSelectionChange]);

  const clearFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedYear !== 'all' || selectedMonth !== 'all' || !!searchTerm.trim();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end mb-6 p-4 border rounded-lg bg-gray-50">
      <div className="flex-1 w-full">
        <label className="text-sm font-medium mb-2 block">Search Orders</label>
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name, order ID, phone, user ID, or status"
          className="w-full"
        />
      </div>

      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Filter by Year</label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Filter by Month</label>
        <Select 
          value={selectedMonth} 
          onValueChange={setSelectedMonth}
          disabled={!selectedYear || selectedYear === 'all'}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={selectedYear && selectedYear !== 'all' ? "Select month" : "Select year first"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {availableMonths.map(month => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div>
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}