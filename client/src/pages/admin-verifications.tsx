import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertCircle, FileCheck, BadgeCheck, XCircle, Eye, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, PropertyDocument } from "@shared/schema";
import { useState } from "react";

const documentLabels: Record<string, string> = {
  sale_deed: "Sale Deed",
  title_deed: "Title Deed",
  encumbrance_certificate: "Encumbrance Certificate",
  property_tax_receipt: "Property Tax Receipt",
  mutation_certificate: "Mutation Certificate",
  noc: "NOC",
  owner_id_proof: "Owner ID Proof",
  allotment_letter: "Allotment Letter",
  possession_letter: "Possession Letter",
  occupancy_certificate: "Occupancy Certificate",
  completion_certificate: "Completion Certificate",
  society_share_certificate: "Society Share Certificate",
  survey_plan: "Survey Plan",
  conversion_certificate: "Land Conversion Certificate",
  patta_khata: "Patta/Khata Certificate",
  ownership_proof: "Ownership Proof",
  noc_society: "NOC from Society",
};

export default function AdminVerifications() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [notes, setNotes] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  const { data: pendingProperties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/pending-verifications"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ propertyId, status, notes }: { propertyId: string; status: string; notes?: string }) => {
      await apiRequest("PATCH", `/api/admin/properties/${propertyId}/verify`, {
        adminId: user?.id,
        status,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Property verification updated" });
      setSelectedProperty(null);
      setNotes("");
    },
    onError: () => {
      toast({ title: "Failed to update verification", variant: "destructive" });
    },
  });

  const handleReviewProperty = async (property: Property) => {
    setSelectedProperty(property);
    setLoadingDocs(true);
    try {
      const response = await fetch(`/api/properties/${property.id}/documents`);
      const docs = await response.json();
      setDocuments(docs);
    } catch (error) {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">Only admins can access this page</p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format&fit=crop&q=60";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Verification Requests</h1>
        <p className="text-muted-foreground">Review and verify property document submissions</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-32 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pendingProperties && pendingProperties.length > 0 ? (
        <div className="space-y-4">
          {pendingProperties.map((property) => (
            <Card key={property.id} data-testid={`card-verification-${property.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={property.images?.[0] || defaultImage}
                    alt={property.title}
                    className="h-24 w-32 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{property.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="font-semibold text-primary">
                        {formatPrice(property.price)}
                      </span>
                      <Badge variant="outline" className="capitalize">{property.propertyType}</Badge>
                      <Badge variant="secondary">For {property.listingType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReviewProperty(property)}
                        data-testid={`button-review-${property.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review Documents
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 text-white"
                        onClick={() => verifyMutation.mutate({ propertyId: property.id, status: "verified" })}
                        disabled={verifyMutation.isPending}
                      >
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          setSelectedProperty(property);
                          setDocuments([]);
                        }}
                        disabled={verifyMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <CardContent>
            <FileCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Verifications</h3>
            <p className="text-muted-foreground">
              All property verifications have been processed
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review: {selectedProperty?.title}</DialogTitle>
            <DialogDescription>
              {selectedProperty?.address}, {selectedProperty?.city}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Uploaded Documents</h4>
              {loadingDocs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-md border">
                      <File className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <Badge variant="outline" className="text-xs">
                          {documentLabels[doc.documentType] || doc.documentType}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No documents uploaded</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Verification Notes (optional)</h4>
              <Textarea
                placeholder="Add notes about your verification decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedProperty(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedProperty) {
                  verifyMutation.mutate({ 
                    propertyId: selectedProperty.id, 
                    status: "rejected",
                    notes: notes || undefined
                  });
                }
              }}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
            <Button
              className="bg-green-600 text-white"
              onClick={() => {
                if (selectedProperty) {
                  verifyMutation.mutate({ 
                    propertyId: selectedProperty.id, 
                    status: "verified",
                    notes: notes || undefined
                  });
                }
              }}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
