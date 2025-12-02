"use client";

/**
 * ImageUpload Component
 *
 * A reusable image upload component with drag-and-drop support,
 * preview, and progress indication. Optimized for Pan-African
 * deployment with low-bandwidth considerations.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImageIcon, AlertCircle } from "lucide-react";

/**
 * Result from successful image upload
 */
export interface ImageUploadResult {
  url: string;
  key: string;
  thumbnailUrl: string;
  smallUrl: string;
  mediumUrl: string;
  hash: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Props for ImageUpload component
 */
export interface ImageUploadProps {
  /** Entity type for organizing uploads */
  entityType: "person" | "officer" | "amber-alert" | "wanted-person";
  /** Entity ID (optional - for existing records) */
  entityId?: string;
  /** Current image URL to display */
  currentImageUrl?: string | null;
  /** Current thumbnail URL for preview */
  currentThumbnailUrl?: string | null;
  /** Callback when upload completes successfully */
  onUploadComplete: (result: ImageUploadResult) => void;
  /** Callback when upload fails */
  onUploadError?: (error: Error) => void;
  /** Callback when image is removed */
  onRemove?: () => void;
  /** Maximum file size in MB (default: 10) */
  maxSizeMB?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether an image is required */
  required?: boolean;
  /** Label for the upload area */
  label?: string;
  /** Help text shown below the upload area */
  helpText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Allowed image MIME types
 */
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/**
 * ImageUpload - Unified image upload component
 */
export function ImageUpload({
  entityType,
  entityId,
  currentImageUrl,
  currentThumbnailUrl,
  onUploadComplete,
  onUploadError,
  onRemove,
  maxSizeMB = 10,
  disabled = false,
  required = false,
  label = "Upload Image",
  helpText,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = React.useState<ImageUploadResult | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Determine what image to show
  const displayImageUrl = previewUrl || uploadedResult?.thumbnailUrl || currentThumbnailUrl || currentImageUrl;
  const hasImage = !!displayImageUrl;

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a valid image (JPEG, PNG, WebP, or GIF)";
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Image must be smaller than ${maxSizeMB}MB. Your file is ${sizeMB.toFixed(1)}MB`;
    }

    return null;
  };

  /**
   * Create preview from file
   */
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Upload file to server
   */
  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Validate
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Create preview
      const preview = await createPreview(file);
      setPreviewUrl(preview);
      setUploadProgress(30);

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      if (entityId) {
        formData.append("entityId", entityId);
      }

      setUploadProgress(50);

      // Upload to API
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadProgress(100);

      if (!data.success || !data.image) {
        throw new Error("Invalid response from server");
      }

      const result: ImageUploadResult = data.image;
      setUploadedResult(result);
      onUploadComplete(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setError(error.message);
      setPreviewUrl(null);
      onUploadError?.(error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  /**
   * Handle drag events
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  /**
   * Handle click to open file picker
   */
  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  /**
   * Handle remove image
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setUploadedResult(null);
    setError(null);
    onRemove?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          hasImage && "border-solid",
          error && "border-destructive",
          disabled && "cursor-not-allowed opacity-50",
          !isDragging && !hasImage && !error && "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        {/* Image Preview */}
        {hasImage && (
          <div className="relative">
            <img
              src={displayImageUrl}
              alt="Upload preview"
              className="h-32 w-32 rounded-lg object-cover"
            />
            {!disabled && !isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Upload Icon and Text */}
        {!hasImage && !isUploading && (
          <>
            <div className="mb-2 rounded-full bg-muted p-3">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to upload
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, WebP or GIF (max {maxSizeMB}MB)
            </p>
          </>
        )}

        {/* Uploading State */}
        {isUploading && (
          <div className="flex flex-col items-center">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading...</p>
            <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}

      {/* Required indicator */}
      {required && !hasImage && (
        <p className="text-xs text-muted-foreground">* Required</p>
      )}
    </div>
  );
}
