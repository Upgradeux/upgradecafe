"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Category } from "@/lib/db/schema/categories";
import { useToast } from "@/components/ui/Toast";
import {
  IconPhoto,
  IconX,
  IconLoader2,
  IconLink,
  IconTrash,
} from "@tabler/icons-react";
import {
  MAX_IMAGE_SIZE_BYTES,
  formatFileSize,
  optimizeImageForUpload,
} from "@/features/cafe/menu/utils/image-helpers";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSlug: string;
  category?: Category | null;
  onSuccess: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  cafeSlug,
  category,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
      setImageUrl(category.imageUrl || "");
      setSortOrder(category.sortOrder);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl("");
      setSortOrder(0);
    }
    setError(null);
    setUploadError(null);
    setShowUrlInput(false);
    setManualUrl("");
  }, [category, isOpen]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadError(null);

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError(
        `"${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed 5 MB.`
      );
      return;
    }

    setIsUploading(true);
    try {
      const optimized = await optimizeImageForUpload(file, 800, 0.85);
      const formData = new FormData();
      formData.append("files", optimized);

      const res = await fetch(`/api/cafe/${cafeSlug}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to upload image.");
      }

      const uploaded = data.data?.images?.[0];
      if (uploaded?.url) {
        setImageUrl(uploaded.url);
        toast({
          title: "Image Uploaded",
          description: "Category image uploaded successfully.",
          variant: "success",
        });
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload category image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = category
        ? `/api/cafe/${cafeSlug}/categories/${category.id}`
        : `/api/cafe/${cafeSlug}/categories`;
      const method = category ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          imageUrl: imageUrl.trim() || null,
          sortOrder,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to save category.");
      }

      toast({
        title: "Category Saved",
        description: `Category "${name}" has been ${category ? "updated" : "created"}.`,
        variant: "success",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Edit Category" : "Add Menu Category"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs rounded-[var(--radius-button)] bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
            {error}
          </div>
        )}

        <Input
          label="Category Name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            const autoSlug = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            setSlug(autoSlug);
          }}
          placeholder="e.g. Specialty Brews, Fresh Bakery, Desserts"
        />

        {/* Category Image Upload Section */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[var(--color-foreground)]">
            Category Image (Optional)
          </label>

          {uploadError && (
            <div className="p-2.5 text-xs rounded-lg bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
              {uploadError}
            </div>
          )}

          {imageUrl ? (
            /* Uploaded Image Preview */
            <div className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-neutral-100">
                <img
                  src={imageUrl}
                  alt={name || "Category"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">
                  {name || "Category"}
                </p>
                <p className="text-[11px] text-[var(--color-muted)] truncate max-w-[220px]">
                  {imageUrl}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[11px] font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    Change photo
                  </button>
                  <span className="text-[var(--color-muted)]">•</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-[11px] font-medium text-[var(--color-danger)] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <IconTrash className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Drop Area or URL Option */
            <div className="space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  isUploading
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/60 bg-[var(--color-surface)]"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-primary)]">
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading category image...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-[var(--color-border-subtle)] flex items-center justify-center mb-1 text-[var(--color-muted)]">
                      <IconPhoto className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-[var(--color-foreground)]">
                      Click to upload category image
                    </p>
                    <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                      JPG, PNG, WebP or AVIF (Max 5 MB)
                    </p>
                  </>
                )}
              </div>

              {/* Alternative: Enter URL */}
              {!showUrlInput ? (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <IconLink className="w-3 h-3" />
                  <span>Or use an image web link</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (manualUrl.trim()) {
                        setImageUrl(manualUrl.trim());
                        setManualUrl("");
                        setShowUrlInput(false);
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowUrlInput(false);
                      setManualUrl("");
                    }}
                  >
                    <IconX className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>

        <Textarea
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Freshly roasted single-origin coffees and manual brews..."
          rows={2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <Input
              label="Display Position (Sort Order)"
              type="number"
              min={0}
              value={sortOrder.toString()}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            />
            <p className="text-[11px] text-[var(--color-muted)] mt-1">
              Lower numbers appear first on your digital menu.
            </p>
          </div>

          <div className="text-xs text-[var(--color-muted)] pt-2 sm:pt-6">
            <span className="font-semibold text-[var(--color-foreground)] block mb-0.5">
              URL Link:
            </span>
            <span className="font-mono text-[11px] text-[var(--color-primary)] truncate block">
              #{slug || "category-slug"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading || isUploading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} disabled={isUploading}>
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

