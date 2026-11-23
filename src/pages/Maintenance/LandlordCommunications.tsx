// Emails sent to landlords about maintenance jobs, newest first. Every
// subject starts with the job ID ("Job 1A2B3C4D: ...").
import { useEffect, useState, Fragment } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/hint";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { get } from "@/helper/api";
import PropertyPicker from "@/utils/PropertyPicker";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";
import { formatLondonDateTime } from "@/utils/maintenanceSla";
import { formatJobAddress } from "./jobActions";

interface LandlordCommunication {
  id: string;
  createdAt: string;
  direction: "OUT" | "IN";
  subject?: string | null;
  body?: string | null;
  toEmails?: string[] | string | null;
  actorName?: string | null;
  property?: {
    addressLine1?: string;
    addressLine2?: string;
    town?: string;
    postCode?: string;
    vendor?: { firstName?: string; lastName?: string; email?: string };
  };
  jobType?: { id: string; jobType: string; description?: string; status?: string; priority?: string } | null;
}

interface CommunicationsResponse {
  items: LandlordCommunication[];
  total: number;
  page: number;
  totalPages: number;
}

/** Same short job reference the server puts in the email subject. */
const jobRef = (id: string) => id.slice(-8).toUpperCase();

const landlordName = (item: LandlordCommunication) => {
  const v = item.property?.vendor;
  if (!v) return "-";
  return [v.firstName, v.lastName].filter(Boolean).join(" ") || v.email || "-";
};

const LandlordCommunications = () => {
  const [items, setItems] = useState<LandlordCommunication[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async (nextPage: number, propertyId: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(nextPage), limit: "20" });
      if (propertyId) query.set("propertyId", propertyId);
      const { data, error } = await get<CommunicationsResponse>(`property-management/landlord-communications?${query.toString()}`);
      if (error) throw new Error(error.message);
      setItems(data?.items ?? []);
      setTotalPages(Math.max(1, data?.totalPages ?? 1));
    } catch (error) {
      toast.error(error?.message || "Failed to load landlord communications");
    } finally {
      setLoading(false);
    }
  };

  // Changing the property filter goes back to page 1; both effects run from one place.
  useEffect(() => {
    load(page, propertyFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, propertyFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="hero-stat text-[2rem]">Landlord Communications</h1>
            <p className="text-sm text-muted-foreground">
              Emails sent to landlords about maintenance jobs.
              <InfoHint text="Every email Woodland sent a landlord about a job. The subject starts with the job ID." />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-md">
            <PropertyPicker
              label="Filter by property"
              value={propertyFilter}
              placeholder="All properties"
              onChange={(id) => {
                setPropertyFilter(id);
                setPage(1);
              }}
            />
          </div>
          {propertyFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPropertyFilter("");
                setPage(1);
              }}
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse table-auto">
                <thead className="bg-background">
                  <tr className="border-b border-border/70">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Landlord</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Property</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No emails sent to landlords yet.</td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const open = !!expanded[item.id];
                      return (
                        <Fragment key={item.id}>
                          <tr
                            className="border-b border-border/50 align-top cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => setExpanded((e) => ({ ...e, [item.id]: !e[item.id] }))}
                          >
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                {formatLondonDateTime(item.createdAt)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap font-mono" onClick={(e) => e.stopPropagation()}>
                              {item.jobType ? (
                                <Link to={`/maintenance/${item.jobType.id}`} className="text-primary hover:underline" title={item.jobType.jobType}>
                                  {jobRef(item.jobType.id)}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm max-w-md truncate" title={item.subject || ""}>{item.subject || "-"}</td>
                            <td className="px-4 py-3 text-sm">{landlordName(item)}</td>
                            <td className="px-4 py-3 text-sm min-w-[12rem]">{formatJobAddress(item.property as JobType["property"])}</td>
                          </tr>
                          {open && (
                            <tr className="border-b border-border/50 bg-muted/20">
                              <td colSpan={5} className="px-6 py-4 text-sm space-y-2">
                                <div className="text-xs text-muted-foreground">
                                  {item.actorName ? `Sent by ${item.actorName}` : "Sent by Woodland"}
                                  {item.toEmails && ` Â· To ${Array.isArray(item.toEmails) ? item.toEmails.join(", ") : item.toEmails}`}
                                </div>
                                <div className="whitespace-pre-wrap">{item.body || "(no message body)"}</div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage((p) => Math.max(p - 1, 1))} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink onClick={() => setPage(index + 1)} isActive={page === index + 1}>
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(p + 1, totalPages))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LandlordCommunications;
