"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Category } from "@/lib/db/schema/categories";
import { useToast } from "@/components/ui/Toast";

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
  const [sortOrder, setSortOrder] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
      setSortOrder(category.sortOrder);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setSortOrder(0);
    }
    setError(null);
  }, [category, isOpen]);

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
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {category ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
