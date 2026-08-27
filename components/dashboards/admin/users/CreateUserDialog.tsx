"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function CreateUserDialog({ token }: { token: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    level: "",
    employee_id: "",
    government_entity: "",
    verification_id: "",
    phone: "",
    salary_per_month: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        salary_per_month: Number(formData.salary_per_month),
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/create-user`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("User created successfully!");
      setOpen(false);
      router.refresh(); // Refresh the page to show the new user
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(
        error.response?.data?.message || "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-brand-700 hover:bg-brand-800">Create New User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] font-header">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">First Name</Label>
              <Input
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastname">Last Name</Label>
              <Input
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
              />
            </div>
           
          </div>
            <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <Label htmlFor="verification_id">Verification ID</Label>
              <Input
                id="verification_id"
                name="verification_id"
                value={formData.verification_id}
                onChange={handleChange}
                required
              />
            </div>

          <div className="space-y-2">
            <Label htmlFor="government_entity">Government Entity</Label>
            <Input
              id="government_entity"
              name="government_entity"
              value={formData.government_entity}
              onChange={handleChange}
              required
            />
          </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_per_month">Monthly Salary (₦)</Label>
              <Input
                id="salary_per_month"
                name="salary_per_month"
                type="number"
                value={formData.salary_per_month}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}