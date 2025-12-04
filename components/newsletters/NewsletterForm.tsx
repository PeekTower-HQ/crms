"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface NewsletterFormProps {
  mode: "create" | "edit";
  newsletter?: {
    id: string;
    name: string;
    description: string;
    pictureUrl: string;
    reactionsEnabled: boolean;
  };
}

export function NewsletterForm({ mode, newsletter }: NewsletterFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: newsletter?.name || "",
    description: newsletter?.description || "",
    pictureUrl: newsletter?.pictureUrl || "",
    reactionsEnabled: newsletter?.reactionsEnabled ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/newsletters"
          : `/api/admin/newsletters/${newsletter?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Operation failed");
      }

      toast({
        title: "Success",
        description: `Newsletter ${mode === "create" ? "created" : "updated"} successfully`,
      });

      if (mode === "create") {
        router.push(`/dashboard/admin/newsletters/${data.newsletter.id}`);
      } else {
        router.push(`/dashboard/admin/newsletters/${newsletter?.id}`);
      }
      router.refresh();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Newsletter Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Police Updates"
          required
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          The public name of your newsletter channel
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Brief description of the newsletter"
          rows={3}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Optional description visible to subscribers
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pictureUrl">Profile Picture URL</Label>
        <Input
          id="pictureUrl"
          type="url"
          value={formData.pictureUrl}
          onChange={(e) =>
            setFormData({ ...formData, pictureUrl: e.target.value })
          }
          placeholder="https://example.com/image.jpg"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Optional URL to an image for the newsletter profile
        </p>
      </div>

      {mode === "edit" && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="reactions">Enable Reactions</Label>
            <p className="text-sm text-muted-foreground">
              Allow subscribers to react to messages
            </p>
          </div>
          <Switch
            id="reactions"
            checked={formData.reactionsEnabled}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, reactionsEnabled: checked })
            }
            disabled={loading}
          />
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Newsletter" : "Update Newsletter"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
