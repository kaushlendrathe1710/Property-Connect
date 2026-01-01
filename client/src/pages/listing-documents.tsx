import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Upload, File, Trash2, FileCheck, AlertCircle, Loader2, BadgeCheck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, PropertyDocument } from "@shared/schema";
import { SaleDocumentTypes, LeaseDocumentTypes } from "@shared/schema";

const saleDocumentLabels: Record<string, string> = {
  sale_deed: "Sale Deed",
  title_deed: "Title Deed",
  encumbrance_certificate: "Encumbrance Certificate",
  property_tax_receipt: "Property Tax Receipt",
  mutation_certificate: "Mutation Certificate",
  noc: "NOC (No Objection Certificate)",
  owner_id_proof: "Owner ID Proof",
  allotment_letter: "Allotment Letter",
  possession_letter: "Possession Letter",
  occupancy_certificate: "Occupancy Certificate",
  completion_certificate: "Completion Certificate",
  society_share_certificate: "Society Share Certificate",
  survey_plan: "Survey Plan",
  conversion_certificate: "Land Conversion Certificate",
  patta_khata: "Patta/Khata Certificate",
};

const leaseDocumentLabels: Record<string, string> = {
  ownership_proof: "Ownership Proof",
  property_tax_receipt: "Property Tax Receipt",
  owner_id_proof: "Owner ID Proof",
  noc_society: "NOC from Society",
};

export default function ListingDocuments() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: ["/api/properties", id],
    enabled: !!id,
  });

  const { data: documents, isLoading: docsLoading } = useQuery<PropertyDocument[]>({
    queryKey: ["/api/properties", id, "documents"],
    enabled: !!id,
  });

  const { data: s3Status } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/config/s3-status"],
  });

  const requestVerificationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/properties/${id}/request-verification`, { userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", id] });
      toast({ title: "Verification requested successfully" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to request verification", variant: "destructive" });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedDocType) {
      toast({ title: "Please select a document type first", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File size must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", selectedDocType);
    formData.append("userId", user?.id || "");

    try {
      const response = await fetch(`/api/properties/${id}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/properties", id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", id] });
      toast({ title: "Document uploaded successfully" });
      setSelectedDocType("");
    } catch (error: any) {
      toast({ title: error.message || "Failed to upload document", variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await apiRequest("DELETE", `/api/documents/${docId}`, { userId: user?.id });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", id, "documents"] });
      toast({ title: "Document deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete document", variant: "destructive" });
    }
  };

  const isOwner = property?.ownerId === user?.id;
  const documentTypes = property?.listingType === "sale" ? SaleDocumentTypes : LeaseDocumentTypes;
  const documentLabels = property?.listingType === "sale" ? saleDocumentLabels : leaseDocumentLabels;

  const getVerificationStatusInfo = () => {
    switch (property?.verificationStatus) {
      case "verified":
        return { icon: BadgeCheck, label: "Verified", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" };
      case "pending":
        return { icon: Clock, label: "Verification Pending", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" };
      case "rejected":
        return { icon: XCircle, label: "Verification Rejected", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" };
      default:
        return { icon: FileCheck, label: "Not Verified", color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Please Login</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to manage documents</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (propertyLoading || docsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
        <Button asChild>
          <Link href="/my-listings">Back to My Listings</Link>
        </Button>
      </div>
    );
  }

  if (!isOwner && user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You can only manage documents for your own properties</p>
        <Button asChild>
          <Link href="/my-listings">Back to My Listings</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = getVerificationStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/my-listings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Property Documents</h1>
          <p className="text-muted-foreground text-sm">{property.title}</p>
        </div>
      </div>

      <Card className={statusInfo.bg}>
        <CardContent className="flex items-center gap-4 p-4">
          <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
          <div className="flex-1">
            <h3 className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</h3>
            {property.verificationNotes && (
              <p className="text-sm text-muted-foreground mt-1">{property.verificationNotes}</p>
            )}
          </div>
          {property.verificationStatus === "unverified" && documents && documents.length > 0 && (
            <Button 
              onClick={() => requestVerificationMutation.mutate()}
              disabled={requestVerificationMutation.isPending}
            >
              {requestVerificationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Request Verification
            </Button>
          )}
        </CardContent>
      </Card>

      {s3Status?.configured === false && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Document storage is not configured. Please contact the administrator to set up AWS S3.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload property documents for verification. Accepted formats: PDF, JPEG, PNG (Max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
              <SelectTrigger className="w-64" data-testid="select-document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypes).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {documentLabels[value] || value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label>
              <Button 
                variant="outline" 
                className="gap-2" 
                disabled={!selectedDocType || uploading || !s3Status?.configured}
                asChild
              >
                <span>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Choose File"}
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={!selectedDocType || uploading || !s3Status?.configured}
                data-testid="input-file-upload"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            {documents?.length || 0} document{documents?.length !== 1 ? "s" : ""} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center gap-4 p-3 rounded-md border bg-muted/30"
                  data-testid={`document-${doc.id}`}
                >
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {documentLabels[doc.documentType] || doc.documentType}
                      </Badge>
                      {doc.fileSize && (
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => handleDeleteDocument(doc.id)}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm mt-1">Upload documents to get your property verified</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
