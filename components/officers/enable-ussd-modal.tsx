
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Officer } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

export function EnableUssdModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [badgeNumber, setBadgeNumber] = useState("");
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!badgeNumber) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/officers/search?badge=${badgeNumber}`);
      const data = await response.json();
      if (response.ok && data) {
        setOfficer(data);
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
        title: "Error",
        description: "An error occurred while searching for the officer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableUssd = async () => {
    if (!officer) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/officers/${officer.id}/enable-ussd`, {
        method: "POST",
      });
      if (response.ok) {
        toast({
          title: "USSD Enabled",
          description: `USSD access has been enabled for ${officer.name}.`,
        });
        setIsOpen(false);
        setOfficer(null);
        setBadgeNumber("");
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "An error occurred while enabling USSD access.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error enabling USSD access:", error);
      toast({
        title: "Error",
        description: "An error occurred while enabling USSD access.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Enable USSD</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable USSD Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter badge number"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
          {officer && (
            <div>
              <h3 className="font-semibold">{officer.name}</h3>
              <p className="text-sm text-muted-foreground">
                Badge: {officer.badge}
              </p>
              <p className="text-sm text-muted-foreground">
                Phone: {officer.phone || "Not available"}
              </p>
              <Button
                onClick={handleEnableUssd}
                disabled={isLoading || !officer.phone}
                className="mt-4"
              >
                {isLoading ? "Enabling..." : "Enable USSD"}
              </Button>
              {!officer.phone && (
                <p className="text-xs text-red-500 mt-2">
                  Officer does not have a phone number.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
