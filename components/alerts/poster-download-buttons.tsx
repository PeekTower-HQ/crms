"use client";

/**
 * Poster Download Buttons Component
 *
 * Provides buttons for downloading alert posters as PDF or image
 * Used in both Wanted Person and Amber Alert detail pages
 *
 * CRMS - Pan-African Digital Public Good
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Image, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface PosterDownloadButtonsProps {
  alertId: string;
  alertType: "wanted" | "amber";
  personName: string;
}

export function PosterDownloadButtons({
  alertId,
  alertType,
  personName,
}: PosterDownloadButtonsProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const downloadPoster = async (format: "pdf" | "image") => {
    setIsDownloading(format);

    try {
      const endpoint =
        alertType === "wanted"
          ? `/api/alerts/wanted/${alertId}/poster?format=${format}`
          : `/api/alerts/amber/${alertId}/poster?format=${format}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate poster");
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${alertType}-${alertId.substring(0, 8)}.${format === "pdf" ? "pdf" : "png"}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Poster Downloaded",
        description:
          format === "pdf"
            ? "PDF poster downloaded successfully"
            : "Image poster downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading poster:", error);
      toast({
        title: "Download Failed",
        description:
          error instanceof Error ? error.message : "Failed to download poster",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isDownloading !== null}
          className="gap-2"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Poster
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => downloadPoster("pdf")}
          disabled={isDownloading !== null}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <div>
            <div className="font-medium">PDF for Printing</div>
            <div className="text-xs text-muted-foreground">
              A4 size, high quality
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadPoster("image")}
          disabled={isDownloading !== null}
          className="gap-2 cursor-pointer"
        >
          <Image className="h-4 w-4" />
          <div>
            <div className="font-medium">Image for Sharing</div>
            <div className="text-xs text-muted-foreground">
              1080x1350 PNG, social media ready
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
