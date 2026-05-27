"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserWithRelations } from "@/types/index";

interface AddUnitDialogProps {
  user: UserWithRelations;
  triggerLabel?: string;
  onAddUnit?: (amount: number) => Promise<void> | void;
}

export function AddUnitDialog({ user, triggerLabel = "Add Unit", onAddUnit }: AddUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const currentLoanUnit = Number(user.loan_unit || 0);
  const parsedAmount = Number(amount || 0);

  const projectedLoanUnit = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return currentLoanUnit;
    }

    return currentLoanUnit + parsedAmount;
  }, [currentLoanUnit, parsedAmount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount to add.");
      return;
    }

    setLoading(true);

    try {
      if (onAddUnit) {
        await onAddUnit(value);
      } else {
        toast.success(
          `Added ${formatCurrency(value)} to the user's purchasing unit.`
        );
      }

      setAmount("");
      setOpen(false);
    } catch (error) {
      console.error("Error handling add unit action:", error);
      toast.error("Unable to process the add unit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-[12px]">
          <PlusCircle className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Unit</DialogTitle>
          <DialogDescription>
            Enter the amount to top up this user&apos;s purchasing unit.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">Current purchasing unit</span>
            <span className="font-semibold text-slate-900">{formatCurrency(currentLoanUnit)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="font-medium">Projected after add</span>
            <span className="font-semibold text-slate-900">{formatCurrency(projectedLoanUnit)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`add-unit-${user.id}`}>Amount to add (₦)</Label>
            <Input
              id={`add-unit-${user.id}`}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}