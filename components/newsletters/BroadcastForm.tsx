"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

interface BroadcastFormProps {
  newsletterId: string;
}

export function BroadcastForm({ newsletterId }: BroadcastFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastBroadcast, setLastBroadcast] = useState<{
    messageId: string;
    timestamp: Date;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/newsletters/${newsletterId}/broadcast`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send broadcast");
      }

      toast({
        title: "Success",
        description: "Broadcast sent successfully to all subscribers",
      });

      // Store last broadcast info
      setLastBroadcast({
        messageId: data.messageId,
        timestamp: new Date(),
      });

      // Clear form
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {lastBroadcast && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Last broadcast sent at {lastBroadcast.timestamp.toLocaleTimeString()}
            {lastBroadcast.messageId && ` (ID: ${lastBroadcast.messageId})`}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">
            Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your broadcast message..."
            rows={6}
            required
            disabled={loading}
          />
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              {message.length} characters
            </p>
            <p className="text-sm text-muted-foreground">
              Will be sent to all subscribers
            </p>
          </div>
        </div>

        <Button type="submit" disabled={loading || !message.trim()}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {loading ? "Sending..." : "Send Broadcast"}
        </Button>
      </form>
    </div>
  );
}
