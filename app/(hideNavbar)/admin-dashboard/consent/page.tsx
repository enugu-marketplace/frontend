'use client';

import {
  useConsentInfiniteQuery,
  useConsentMutation,
} from "@/hooks/useCompliance";
import { ComplianceCard } from "@/components/ComplianceCard";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  Alert01Icon,
  Download01Icon,
  Search01Icon,
  UserIcon,
  Building03Icon,
  Mail01Icon,
  Call02Icon,
  CreditCardIcon,
  Calendar03Icon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Consent } from "@/types/compliance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";


// Status options for filtering
const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
  { value: "REJECTED", label: "Rejected" },
];

// Sort options
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "salary-high", label: "Salary (High to Low)" },
  { value: "salary-low", label: "Salary (Low to High)" },
];

export default function AdminCompliancePage() {
  const { data: clientSession, status } = useSession();
  const [serverUser, setServerUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [selectedCompliance, setSelectedCompliance] = useState<Consent | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updatingComplianceId, setUpdatingComplianceId] = useState<string | null>(null);

  const { ref, inView } = useInView();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useConsentInfiniteQuery();

  const updateMutation = useConsentMutation();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(setServerUser)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const user = clientSession?.user || serverUser;

  // Redirect if not admin
  useEffect(() => {
    if (status === "authenticated" && user?.role !== "super_admin") {
      redirect("/unauthorized");
    }
  }, [user, status]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Remove duplicates by ID
  const allCompliance = useMemo(() => {
    const seenIds = new Set<string>();
    const uniqueItems: Consent[] = [];

    data?.pages.forEach((page) => {
      page.data.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueItems.push(item);
        }
      });
    });

    return uniqueItems;
  }, [data]);

  // Filter and sort compliance items
  const filteredAndSortedCompliance = useMemo(() => {
    let filtered = [...allCompliance];

    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const fullName = `${item.user.firstname} ${item.user.lastname}`.toLowerCase();
        const employeeId = item.user.employee_id?.toLowerCase() || "";
        const govEntity = item.user.government_entity?.toLowerCase() || "";
        const email = item.user.email?.toLowerCase() || "";
        
        return (
          fullName.includes(query) ||
          employeeId.includes(query) ||
          govEntity.includes(query) ||
          email.includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Update active filters for display
    const active: string[] = [];
    if (searchQuery.trim()) active.push(`Search: "${searchQuery}"`);
    if (statusFilter !== "ALL") active.push(`Status: ${statusFilter}`);

    setActiveFilters(active);

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-asc":
          return `${a.user.firstname} ${a.user.lastname}`.localeCompare(
            `${b.user.firstname} ${b.user.lastname}`
          );
        case "name-desc":
          return `${b.user.firstname} ${b.user.lastname}`.localeCompare(
            `${a.user.firstname} ${a.user.lastname}`
          );
        case "salary-high":
          return (b.user.salary_per_month || 0) - (a.user.salary_per_month || 0);
        case "salary-low":
          return (a.user.salary_per_month || 0) - (b.user.salary_per_month || 0);
        default:
          return 0;
      }
    });
  }, [allCompliance, searchQuery, statusFilter, sortBy]);

  const handleViewDetails = (consent: Consent) => {
    setSelectedCompliance(consent);
    setDetailDialogOpen(true);
  };

  const handleApprove = async (complianceId: string) => {
    setUpdatingComplianceId(complianceId);
    try {
      await updateMutation.mutateAsync({ complianceId, status: "APPROVED" });
      // Refetch data to get updated status
      await refetch();
      toast({
        title: "Success",
        description: "Compliance form approved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve compliance form",
        variant: "destructive",
      });
    } finally {
      setUpdatingComplianceId(null);
    }
  };

  const handleReject = async (complianceId: string) => {
    setUpdatingComplianceId(complianceId);
    try {
      await updateMutation.mutateAsync({ complianceId, status: "DENIED" });
      // Refetch data to get updated status
      await refetch();
      toast({
        title: "Success",
        description: "Compliance form rejected successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject compliance form",
        variant: "destructive",
      });
    } finally {
      setUpdatingComplianceId(null);
    }
  };

  const handleDownloadImage = (consent: Consent) => {
    const link = document.createElement("a");
    link.href = consent.form_url;
    link.download = `compliance-${consent.user.employee_id}-${consent.user.firstname}-${consent.user.lastname}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortBy("newest");
  };

  if (status === "loading") {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-slate-500">
        <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
        Loading compliance forms
      </p>
    );
  }

  if (error) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium text-red-900">
          <HugeiconsIcon icon={Alert01Icon} size={17} strokeWidth={1.8} />
          Could not load compliance forms
        </p>
        <p className="mt-1 text-[13px] text-red-700">{(error as Error).message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 h-9 rounded-sm border border-red-300 bg-white px-4 text-[13px] font-medium text-red-700 hover:bg-red-50"
        >
          Try again
        </button>
      </div>
    );
  }

  const pendingCount = allCompliance.filter((item) => item.status === "PENDING").length;
  const approvedCount = allCompliance.filter((item) => item.status === "APPROVED").length;
  const deniedCount = allCompliance.filter((item) => item.status === "REJECTED").length;

  const detailRows = selectedCompliance
    ? [
        {
          icon: UserIcon,
          label: "Full name",
          value: `${selectedCompliance.user.firstname} ${selectedCompliance.user.lastname}`,
        },
        { icon: CreditCardIcon, label: "Employee ID", value: selectedCompliance.user.employee_id },
        { icon: Mail01Icon, label: "Email", value: selectedCompliance.user.email },
        { icon: Call02Icon, label: "Phone", value: selectedCompliance.user.phone },
        {
          icon: Building03Icon,
          label: "Government entity",
          value: selectedCompliance.user.government_entity,
        },
        {
          icon: CreditCardIcon,
          label: "Monthly salary",
          value: `\u20a6${selectedCompliance.user.salary_per_month?.toLocaleString()}`,
        },
        {
          icon: Calendar03Icon,
          label: "Submitted on",
          value: new Date(selectedCompliance.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Consents</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review compliance forms before staff can order against their purchasing unit.
          </p>
        </div>
        <p className="text-[13px] text-slate-500">
          Showing {filteredAndSortedCompliance.length} of {allCompliance.length} forms
        </p>
      </div>

      {/* Status summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-slate-200 bg-white p-4">
          <p className="text-[13px] text-slate-500">Awaiting review</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{pendingCount}</p>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <p className="text-[13px] text-slate-500">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-brand-700">{approvedCount}</p>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <p className="text-[13px] text-slate-500">Denied</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{deniedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border border-slate-200 bg-white p-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, employee ID, email..."
            className="h-9 w-full rounded-sm border border-slate-300 pl-9 pr-3 text-[13px] outline-none focus:border-brand-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 rounded-sm border border-slate-300 bg-white px-2 text-[13px] text-slate-700 outline-none focus:border-brand-600"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {activeFilters.length > 0 && (
          <button
            onClick={clearFilters}
            className="ml-auto text-[13px] text-brand-700 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 py-16 text-sm text-slate-500">
          <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
          Loading compliance forms
        </p>
      ) : filteredAndSortedCompliance.length === 0 ? (
        <div className="border border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <HugeiconsIcon icon={Shield01Icon} size={24} strokeWidth={1.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">No compliance forms found</p>
          {activeFilters.length > 0 && (
            <>
              <p className="mt-1 text-[13px] text-slate-500">
                Try adjusting your search or filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 h-9 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedCompliance.map((compliance) => (
              <ComplianceCard
                key={`compliance-${compliance.id}-${compliance.updatedAt}`}
                consent={compliance}
                onView={handleViewDetails}
                onApprove={handleApprove}
                onReject={handleReject}
                isUpdating={updatingComplianceId === compliance.id}
              />
            ))}
          </div>

          {hasNextPage && (
            <div ref={ref} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <span className="flex items-center gap-2 text-[13px] text-slate-500">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={15}
                    strokeWidth={2}
                    className="animate-spin"
                  />
                  Loading more forms
                </span>
              )}
            </div>
          )}

          {!hasNextPage && filteredAndSortedCompliance.length > 0 && (
            <p className="text-center text-[13px] text-slate-500">All forms loaded.</p>
          )}
        </>
      )}

      {/* Detail dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-brand-900 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white">
                <HugeiconsIcon icon={Shield01Icon} size={17} strokeWidth={1.8} />
              </span>
              <DialogTitle className="m-0 text-base font-semibold text-white">
                Compliance form
              </DialogTitle>
            </div>
            <DialogDescription className="mt-1 text-[13px] text-brand-100/80">
              {selectedCompliance?.user.firstname} {selectedCompliance?.user.lastname}
              {selectedCompliance?.user.employee_id ? ` \u00b7 ${selectedCompliance.user.employee_id}` : ""}
            </DialogDescription>
          </div>

          <ScrollArea className="max-h-[75vh]">
            {selectedCompliance && (
              <div className="space-y-5 px-6 py-5">
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={cn(
                      "rounded-sm px-2 py-1 text-[11px] font-medium capitalize ring-1",
                      selectedCompliance.status === "APPROVED"
                        ? "bg-brand-50 text-brand-800 ring-brand-200"
                        : selectedCompliance.status === "PENDING"
                        ? "bg-amber-50 text-amber-800 ring-amber-200"
                        : "bg-red-50 text-red-700 ring-red-200"
                    )}
                  >
                    {selectedCompliance.status.toLowerCase()}
                  </span>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  {detailRows.map(({ icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 border border-slate-200 px-3 py-2.5"
                    >
                      <HugeiconsIcon
                        icon={icon}
                        size={16}
                        strokeWidth={1.8}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div className="min-w-0">
                        <dt className="text-[11px] text-slate-500">{label}</dt>
                        <dd className="truncate text-[13px] font-medium text-slate-800">
                          {value || "-"}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>

                <div>
                  <p className="text-[12px] font-medium text-slate-500">Uploaded document</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCompliance.form_url}
                    alt="Compliance form"
                    className="mt-2 max-h-72 w-full border border-slate-200 bg-slate-50 object-contain"
                  />
                </div>

                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <button
                    onClick={() => handleDownloadImage(selectedCompliance)}
                    className="flex h-10 items-center justify-center gap-2 rounded-sm border border-slate-300 px-4 text-[13px] font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
                  >
                    <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={1.8} />
                    Download document
                  </button>

                  {selectedCompliance.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(selectedCompliance.id)}
                        disabled={updatingComplianceId === selectedCompliance.id}
                        className="flex h-10 items-center justify-center gap-2 rounded-sm bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <HugeiconsIcon
                          icon={
                            updatingComplianceId === selectedCompliance.id
                              ? Loading03Icon
                              : CheckmarkCircle01Icon
                          }
                          size={16}
                          strokeWidth={1.8}
                          className={
                            updatingComplianceId === selectedCompliance.id ? "animate-spin" : undefined
                          }
                        />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedCompliance.id)}
                        disabled={updatingComplianceId === selectedCompliance.id}
                        className="flex h-10 items-center justify-center gap-2 rounded-sm bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <HugeiconsIcon
                          icon={
                            updatingComplianceId === selectedCompliance.id
                              ? Loading03Icon
                              : CancelCircleIcon
                          }
                          size={16}
                          strokeWidth={1.8}
                          className={
                            updatingComplianceId === selectedCompliance.id ? "animate-spin" : undefined
                          }
                        />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
