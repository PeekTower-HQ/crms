"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Link2, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BroadcastFormProps {
  newsletterId: string;
}

type BroadcastType = "text" | "link_preview";

export function BroadcastForm({ newsletterId }: BroadcastFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [broadcastType, setBroadcastType] = useState<BroadcastType>("text");

  // Text broadcast fields
  const [message, setMessage] = useState("");

  // Link preview broadcast fields
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [media, setMedia] = useState("");

  const [lastBroadcast, setLastBroadcast] = useState<{
    messageId: string;
    timestamp: Date;
    type: BroadcastType;
  } | null>(null);

  // Check if body contains URL
  const containsUrl = (text: string): boolean => {
    const urlRegex = /https?:\/\//i;
    return urlRegex.test(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build request payload based on broadcast type
    let payload: Record<string, unknown>;

    if (broadcastType === "text") {
      if (!message.trim()) {
        toast({
          title: "Error",
          description: "Please enter a message",
          variant: "destructive",
        });
        return;
      }
      payload = {
        type: "text",
        message: message,
      };
    } else {
      // Link preview validation
      if (!body.trim()) {
        toast({
          title: "Error",
          description: "Please enter message body",
          variant: "destructive",
        });
        return;
      }

      if (!containsUrl(body)) {
        toast({
          title: "Error",
          description: "Body must contain at least one URL (http:// or https://)",
          variant: "destructive",
        });
        return;
      }

      payload = {
        type: "link_preview",
        body: body,
        title: title || undefined,
        media: media || undefined,
      };
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/newsletters/${newsletterId}/broadcast`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send broadcast");
      }

      toast({
        title: "Success",
        description: `${broadcastType === "text" ? "Text" : "Link preview"} broadcast sent successfully to all subscribers`,
      });

      // Store last broadcast info
      setLastBroadcast({
        messageId: data.messageId,
        timestamp: new Date(),
        type: broadcastType,
      });

      // Clear form
      if (broadcastType === "text") {
        setMessage("");
      } else {
        setBody("");
        setTitle("");
        setMedia("");
      }
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

  const isFormValid = broadcastType === "text"
    ? message.trim().length > 0
    : body.trim().length > 0 && containsUrl(body);

  return (
    <div className="space-y-4">
      {lastBroadcast && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Last {lastBroadcast.type === "text" ? "text" : "link preview"} broadcast sent at{" "}
            {lastBroadcast.timestamp.toLocaleTimeString()}
            {lastBroadcast.messageId && ` (ID: ${lastBroadcast.messageId})`}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs
          value={broadcastType}
          onValueChange={(value) => setBroadcastType(value as BroadcastType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" disabled={loading}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Text Message
            </TabsTrigger>
            <TabsTrigger value="link_preview" disabled={loading}>
              <Link2 className="mr-2 h-4 w-4" />
              Link Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
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
                  Plain text broadcast
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link_preview" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Link preview broadcasts create rich previews with images and titles.
                The body must contain at least one URL.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Preview title..."
                maxLength={255}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                {title.length}/255 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">
                Body <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter message body with at least one URL (https://example.com)..."
                rows={5}
                required
                disabled={loading}
              />
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  {body.length} characters
                </p>
                {body.trim() && (
                  <p className={`text-sm ${containsUrl(body) ? "text-green-600" : "text-red-500"}`}>
                    {containsUrl(body) ? "✓ Contains URL" : "✗ URL required"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">
                Media URL <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="media"
                value={media}
                onChange={(e) => setMedia(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={loading}
                type="url"
              />
              <p className="text-sm text-muted-foreground">
                Image URL for preview (HTTP, HTTPS, or data URI)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={loading || !isFormValid}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {loading ? "Sending..." : `Send ${broadcastType === "text" ? "Text" : "Link Preview"} Broadcast`}
        </Button>
      </form>
    </div>
  );
}
