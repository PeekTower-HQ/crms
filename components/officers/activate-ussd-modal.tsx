"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, Copy, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

type Stage = "search" | "confirm" | "success";

interface OfficerData {
  id: string;
  badge: string;
  name: string;
  phone: string;
  station: {
    name: string;
    code: string;
  };
  role: {
    name: string;
  };
  ussdPhoneNumber?: string;
  ussdEnabled?: boolean;
  ussdRegisteredAt?: string;
}

interface ActivateUssdModalProps {
  onSuccess?: () => void;
}

export function ActivateUssdModal({ onSuccess }: ActivateUssdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("search");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [officer, setOfficer] = useState<OfficerData | null>(null);
  const [quickPin, setQuickPin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { toast } = useToast();

  const resetModal = () => {
    setStage("search");
    setBadgeNumber("");
    setOfficer(null);
    setQuickPin("");
    setIsLoading(false);
    setAlreadyRegistered(false);
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset after animation completes
      setTimeout(resetModal, 300);
    }
  };

  const handleSearch = async () => {
    if (!badgeNumber.trim()) {
      toast({
        title: "Badge number required",
        description: "Please enter a badge number to search.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAlreadyRegistered(false);

    try {
      const response = await fetch(
        `/api/officers/search?badge=${encodeURIComponent(badgeNumber.trim())}`
      );
      const data = await response.json();

      if (response.ok && data) {
        setOfficer(data);
        setStage("confirm");
      } else {
        setOfficer(null);
        toast({
          title: "Officer not found",
          description: "No officer found with that badge number.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching for officer:", error);
      toast({
        title: "Search error",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!officer) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/officers/${officer.id}/activate-ussd`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setQuickPin(data.quickPin);
        setOfficer(data.officer);
        setStage("success");
        
        toast({
          title: "USSD Activated",
          description: `USSD access activated for ${officer.name}`,
        });

        // Call onSuccess callback to refresh parent component
        if (onSuccess) {
          onSuccess();
        }
      } else if (data.alreadyRegistered) {
        // Officer already has USSD access
        setAlreadyRegistered(true);
        setOfficer(data.officer);
        toast({
          title: "Already Registered",
          description: `${officer.name} already has USSD access`,
          variant: "default",
        });
      } else {
        toast({
          title: "Activation Failed",
          description: data.error || "An error occurred during activation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error activating USSD:", error);
      toast({
        title: "Activation Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPin = async () => {
    if (!quickPin) return;

    try {
      await navigator.clipboard.writeText(quickPin);
      toast({
        title: "Copied!",
        description: "Quick PIN copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy failed",
        description: "Please copy the PIN manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Phone className="mr-2 h-4 w-4" />
          Add Officer to USSD
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {/* SEARCH STAGE */}
        {stage === "search" && (
          <>
            <DialogHeader>
              <DialogTitle>Activate USSD Access</DialogTitle>
              <DialogDescription>
                Search for an officer by badge number to enable USSD access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter badge number (e.g., HQ-00001)"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  disabled={isLoading}
                  className="font-mono"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    "Searching..."
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Only officers with a registered phone number can be activated for USSD.
                </AlertDescription>
              </Alert>
            </div>
          </>
        )}

        {/* CONFIRM STAGE */}
        {stage === "confirm" && officer && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm USSD Activation</DialogTitle>
              <DialogDescription>
                Review officer details and activate USSD access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Already Registered Warning */}
              {alreadyRegistered && (
                <Alert className="border-yellow-600 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    This officer already has USSD access.{" "}
                    <Link
                      href={`/dashboard/admin/ussd-officers/${officer.id}`}
                      className="underline font-medium"
                      onClick={() => handleClose(false)}
                    >
                      View details
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {/* Officer Details Card */}
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div>
                  <div className="text-lg font-semibold">{officer.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono">
                      {officer.badge}
                    </Badge>
                    <Badge variant="secondary">{officer.role.name}</Badge>
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono">{officer.phone || "No phone"}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {officer.station.name} ({officer.station.code})
                  </div>
                </div>
              </div>

              {/* Validation Error */}
              {!officer.phone && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Officer does not have a phone number on record. Please add a phone
                    number before activating USSD.
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Box */}
              {officer.phone && !alreadyRegistered && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    A secure 4-digit Quick PIN will be generated for this officer to use
                    for USSD authentication. Share it securely with them.
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStage("search")}>
                  Back
                </Button>
                <Button
                  onClick={handleActivate}
                  disabled={isLoading || !officer.phone || alreadyRegistered}
                >
                  {isLoading ? "Activating..." : "Activate USSD Access"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* SUCCESS STAGE */}
        {stage === "success" && officer && quickPin && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                USSD Access Activated
              </DialogTitle>
              <DialogDescription>
                Quick PIN generated successfully
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Success Message */}
              <Alert className="border-green-600 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  USSD access has been activated for <strong>{officer.name}</strong>
                </AlertDescription>
              </Alert>

              {/* Quick PIN Display */}
              <div className="border-2 border-blue-600 rounded-lg p-4 bg-blue-50 text-center space-y-2">
                <div className="text-sm font-medium text-blue-900">Quick PIN</div>
                <div className="text-4xl font-bold font-mono tracking-widest text-blue-600">
                  {quickPin}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPin}
                  className="mt-2"
                >
                  <Copy className="mr-2 h-3 w-3" />
                  Copy to Clipboard
                </Button>
              </div>

              {/* Important Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs space-y-1">
                  <div className="font-semibold">Important:</div>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>This PIN will only be shown once</li>
                    <li>Share it securely with the officer</li>
                    <li>Officer will use it for USSD authentication</li>
                    <li>If lost, you can reset it from the officer's detail page</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/admin/ussd-officers/${officer.id}`}>
                    View Officer Details
                  </Link>
                </Button>
                <Button onClick={() => handleClose(false)}>Done</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
