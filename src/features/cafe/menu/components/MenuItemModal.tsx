"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Category } from "@/lib/db/schema/categories";
import { MenuItem } from "@/lib/db/schema/menu-items";
import { useToast } from "@/components/ui/Toast";
import {
  IconLeaf,
  IconFlame,
  IconStar,
  IconCup,
  IconSnowflake,
  IconPhoto,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconUpload,
  IconX,
  IconLoader2,
  IconPlus,
  IconAdjustmentsHorizontal,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react";
import { FullModifierGroupWithOption } from "@/lib/db/schema/modifiers";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_TOTAL_IMAGES_SIZE_BYTES,
  MAX_IMAGES_PER_ITEM,
  parseMenuItemImages,
  serializeMenuItemImages,
  formatFileSize,
} from "@/features/cafe/menu/utils/image-helpers";

export type FoodType = "VEG" | "NON_VEG" | "EGG" | "VEGAN";
export type ServingTemperature = "NOT_APPLICABLE" | "HOT" | "COLD" | "ROOM_TEMP";

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSlug: string;
  categories: Category[];
  item?: (MenuItem & {
    foodType?: string;
    isBestseller?: boolean;
    isSpicy?: boolean;
    temperature?: string;
    allergens?: string | null;
    calories?: number | null;
    proteinGrams?: number | null;
    fatGrams?: number | null;
    carbsGrams?: number | null;
  }) | null;
  selectedCategoryId?: string;
  onSuccess: () => void;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  cafeSlug,
  categories,
  item,
  selectedCategoryId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState(selectedCategoryId || categories[0]?.id || "");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("150");

  // Step 2: Dietary & Multi-Image Upload
  const [foodType, setFoodType] = useState<FoodType>("VEG");
  const [images, setImages] = useState<Array<{ url: string; name?: string; size?: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Badges & Serving Specs
  const [isBestseller, setIsBestseller] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [temperature, setTemperature] = useState<ServingTemperature>("NOT_APPLICABLE");
  const [allergens, setAllergens] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [prepTime, setPrepTime] = useState("10");
  const [sortOrder, setSortOrder] = useState("0");

  // Step 4: Customizations (Add-ons & Options)
  const [availableModifierGroups, setAvailableModifierGroups] = useState<FullModifierGroupWithOption[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isLoadingModifiers, setIsLoadingModifiers] = useState(false);

  // Inline Customization Group creation & edit state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [isDeletingGroupId, setIsDeletingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupSelectionType, setNewGroupSelectionType] = useState<"SINGLE" | "MULTIPLE">("MULTIPLE");
  const [newGroupIsRequired, setNewGroupIsRequired] = useState(false);
  const [newGroupOptions, setNewGroupOptions] = useState<
    Array<{
      name: string;
      priceDelta: string;
      dietaryType: "VEG" | "NON_VEG" | "EGG" | "VEGAN" | "NONE";
    }>
  >([
    { name: "", priceDelta: "0", dietaryType: "VEG" },
    { name: "", priceDelta: "0", dietaryType: "VEG" },
  ]);
  const [isSavingNewGroup, setIsSavingNewGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModifierGroups = async () => {
    setIsLoadingModifiers(true);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/modifiers`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAvailableModifierGroups(data.data || []);
      }

      if (item) {
        const itemRes = await fetch(`/api/cafe/${cafeSlug}/modifiers?menuItemId=${item.id}`);
        const itemData = await itemRes.json();
        if (itemRes.ok && itemData.success && Array.isArray(itemData.data)) {
          setSelectedGroupIds(itemData.data.map((g: any) => g.id));
        } else {
          setSelectedGroupIds([]);
        }
      } else {
        setSelectedGroupIds([]);
      }
    } catch {
      // Continue gracefully
    } finally {
      setIsLoadingModifiers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadModifierGroups();
    }
  }, [isOpen, item, cafeSlug]);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSlug(item.slug);
      setCategoryId(item.categoryId);
      setDescription(item.description || "");
      setPrice(item.price.toString());
      setFoodType(
        (item.foodType as FoodType) ||
          (item.isVegetarian === false ? "NON_VEG" : "VEG")
      );
      setIsBestseller(Boolean(item.isBestseller));
      setIsSpicy(Boolean(item.isSpicy));
      setTemperature((item.temperature as ServingTemperature) || "NOT_APPLICABLE");
      setAllergens(item.allergens || "");
      setCalories(item.calories ? item.calories.toString() : "");
      setProtein(item.proteinGrams ? item.proteinGrams.toString() : "");
      setFat(item.fatGrams ? item.fatGrams.toString() : "");
      setCarbs(item.carbsGrams ? item.carbsGrams.toString() : "");

      const parsedImages = parseMenuItemImages(item.imageKey);
      setImages(parsedImages.map((u, idx) => ({ url: u, name: `Photo ${idx + 1}` })));

      setIsAvailable(item.isAvailable);
      setPrepTime(item.preparationTimeMinutes ? item.preparationTimeMinutes.toString() : "");
      setSortOrder(item.sortOrder.toString());
    } else {
      setName("");
      setSlug("");
      setCategoryId(selectedCategoryId && selectedCategoryId !== "all" ? selectedCategoryId : categories[0]?.id || "");
      setDescription("");
      setPrice("150");
      setFoodType("VEG");
      setIsBestseller(false);
      setIsSpicy(false);
      setTemperature("NOT_APPLICABLE");
      setAllergens("");
      setCalories("");
      setProtein("");
      setFat("");
      setCarbs("");
      setImages([]);
      setIsAvailable(true);
      setPrepTime("");
      setSortOrder("0");
    }
    setCurrentStep(1);
    setError(null);
    setUploadError(null);
    setShowUrlInput(false);
    setManualUrl("");
    setShowCreateGroup(false);
    setEditingGroupId(null);
    setConfirmDeleteGroupId(null);
    setIsDeletingGroupId(null);
    setCreateGroupError(null);
  }, [item, isOpen, selectedCategoryId, categories]);

  const validateStep = (stepNumber: number) => {
    if (stepNumber === 1) {
      if (!name.trim()) {
        setError("Please enter an item name.");
        return false;
      }
      if (name.trim().length < 2) {
        setError("Item name must be at least 2 characters.");
        return false;
      }
      if (!categoryId) {
        setError("Please select a category.");
        return false;
      }
      if (!price || isNaN(parseInt(price)) || parseInt(price) < 0) {
        setError("Please enter a valid non-negative price.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3 | 4);
  };

  const handleAddNewOptionRow = () => {
    setNewGroupOptions((prev) => [
      ...prev,
      { name: "", priceDelta: "0", dietaryType: "VEG" },
    ]);
  };

  const handleRemoveOptionRow = (index: number) => {
    setNewGroupOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionRowChange = (
    index: number,
    field: "name" | "priceDelta" | "dietaryType",
    value: string
  ) => {
    setNewGroupOptions((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === "name") {
        const lower = value.toLowerCase();
        if (
          lower.includes("chicken") ||
          lower.includes("chiken") ||
          lower.includes("chkn") ||
          lower.includes("meat") ||
          lower.includes("fish") ||
          lower.includes("pork") ||
          lower.includes("beef") ||
          lower.includes("mutton") ||
          lower.includes("bacon") ||
          lower.includes("ham") ||
          lower.includes("prawn") ||
          lower.includes("salmon") ||
          lower.includes("seekh") ||
          lower.includes("pepperoni") ||
          lower.includes("turkey") ||
          lower.includes("tuna")
        ) {
          item.dietaryType = "NON_VEG";
        } else if (
          lower.includes("egg") ||
          lower.includes("omelette") ||
          lower.includes("scramble")
        ) {
          item.dietaryType = "EGG";
        } else if (lower.includes("vegan")) {
          item.dietaryType = "VEGAN";
        } else if (
          lower.includes("tissue") ||
          lower.includes("napkin") ||
          lower.includes("cutlery") ||
          lower.includes("bag")
        ) {
          item.dietaryType = "NONE";
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleStartCreateGroup = () => {
    setEditingGroupId(null);
    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupSelectionType("MULTIPLE");
    setNewGroupIsRequired(false);
    setNewGroupOptions([
      { name: "", priceDelta: "0", dietaryType: "VEG" },
      { name: "", priceDelta: "0", dietaryType: "VEG" },
    ]);
    setCreateGroupError(null);
    setShowCreateGroup(true);
  };

  const handleStartEditGroup = (group: FullModifierGroupWithOption) => {
    setEditingGroupId(group.id);
    setShowCreateGroup(false); // Render inline editor directly inside this group's card
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || "");
    setNewGroupSelectionType(group.selectionType as "SINGLE" | "MULTIPLE");
    setNewGroupIsRequired(Boolean(group.isRequired));
    setNewGroupOptions(
      group.options && group.options.length > 0
        ? group.options.map((opt) => {
            let dt: "VEG" | "NON_VEG" | "EGG" | "VEGAN" | "NONE" =
              ((opt as any).dietaryType as any) || "VEG";
            const lower = opt.name.toLowerCase();
            if (
              dt === "VEG" &&
              (lower.includes("chicken") ||
                lower.includes("chiken") ||
                lower.includes("chkn") ||
                lower.includes("meat") ||
                lower.includes("bacon") ||
                lower.includes("fish") ||
                lower.includes("prawn") ||
                lower.includes("pork") ||
                lower.includes("beef") ||
                lower.includes("mutton"))
            ) {
              dt = "NON_VEG";
            } else if (dt === "VEG" && (lower.includes("egg") || lower.includes("omelette"))) {
              dt = "EGG";
            } else if (
              dt === "VEG" &&
              (lower.includes("tissue") || lower.includes("napkin") || lower.includes("cutlery"))
            ) {
              dt = "NONE";
            }

            return {
              name: opt.name,
              priceDelta: (opt.priceDelta || 0).toString(),
              dietaryType: dt,
            };
          })
        : [{ name: "", priceDelta: "0", dietaryType: "VEG" }]
    );
    setCreateGroupError(null);
  };

  const handleCancelGroupForm = () => {
    setShowCreateGroup(false);
    setEditingGroupId(null);
    setCreateGroupError(null);
  };

  const handleSaveGroup = async () => {
    setCreateGroupError(null);
    if (!newGroupName.trim()) {
      setCreateGroupError("Please enter a customization group title.");
      return;
    }

    const validOptions = newGroupOptions
      .map((opt) => ({
        name: opt.name.trim(),
        priceDelta: parseInt(opt.priceDelta) || 0,
        dietaryType: opt.dietaryType || "VEG",
        isAvailable: true,
      }))
      .filter((opt) => opt.name.length > 0);

    if (validOptions.length === 0) {
      setCreateGroupError("Please add at least one option name.");
      return;
    }

    setIsSavingNewGroup(true);
    try {
      const isEditing = Boolean(editingGroupId);
      const url = isEditing
        ? `/api/cafe/${cafeSlug}/modifiers/${editingGroupId}`
        : `/api/cafe/${cafeSlug}/modifiers`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined,
          selectionType: newGroupSelectionType,
          isRequired: newGroupIsRequired,
          minSelections: newGroupIsRequired ? 1 : 0,
          maxSelections: newGroupSelectionType === "SINGLE" ? 1 : null,
          options: validOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to ${isEditing ? "update" : "create"} customization group.`);
      }

      const savedGroup = data.data as FullModifierGroupWithOption;

      if (isEditing) {
        setAvailableModifierGroups((prev) =>
          prev.map((g) => (g.id === savedGroup.id ? savedGroup : g))
        );
        toast({
          title: "Customization Group Updated",
          description: `"${savedGroup.name}" has been updated.`,
          variant: "success",
        });
      } else {
        setAvailableModifierGroups((prev) => [...prev, savedGroup]);
        setSelectedGroupIds((prev) => [...prev, savedGroup.id]);
        toast({
          title: "Customization Group Created",
          description: `"${savedGroup.name}" is now linked to this menu item.`,
          variant: "success",
        });
      }

      handleCancelGroupForm();
    } catch (err: any) {
      setCreateGroupError(err.message || "Failed to save customization group.");
    } finally {
      setIsSavingNewGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    setIsDeletingGroupId(groupId);
    try {
      const res = await fetch(`/api/cafe/${cafeSlug}/modifiers/${groupId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to delete customization group.");
      }

      setAvailableModifierGroups((prev) => prev.filter((g) => g.id !== groupId));
      setSelectedGroupIds((prev) => prev.filter((id) => id !== groupId));
      if (editingGroupId === groupId) {
        handleCancelGroupForm();
      }
      setConfirmDeleteGroupId(null);

      toast({
        title: "Customization Group Deleted",
        description: `"${groupName}" has been removed.`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Delete",
        description: err.message || "An error occurred while deleting.",
        variant: "danger",
      });
    } finally {
      setIsDeletingGroupId(null);
    }
  };

  // Multi-File Upload with 5MB individual & 12MB total limits
  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploadError(null);

    const remainingSlots = MAX_IMAGES_PER_ITEM - images.length;
    if (remainingSlots <= 0) {
      setUploadError(`Maximum ${MAX_IMAGES_PER_ITEM} images allowed per item.`);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);

    // Validate each file size <= 5MB
    for (const f of selectedFiles) {
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        setUploadError(`"${f.name}" (${formatFileSize(f.size)}) exceeds the maximum allowed 5 MB per image.`);
        return;
      }
    }

    // Validate total size <= 12MB
    const currentTotalSize = images.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const newFilesSize = selectedFiles.reduce((acc, curr) => acc + curr.size, 0);
    if (currentTotalSize + newFilesSize > MAX_TOTAL_IMAGES_SIZE_BYTES) {
      setUploadError(`Total images size (${formatFileSize(currentTotalSize + newFilesSize)}) exceeds the 12 MB limit.`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const res = await fetch(`/api/cafe/${cafeSlug}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to upload images.");
      }

      const uploaded = data.data.images as Array<{ url: string; name: string; size: number }>;
      setImages((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES_PER_ITEM));
      toast({
        title: "Photos Uploaded",
        description: `Successfully added ${uploaded.length} photo(s).`,
        variant: "success",
      });
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload images.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    if (images.length >= MAX_IMAGES_PER_ITEM) {
      setUploadError(`Maximum ${MAX_IMAGES_PER_ITEM} images allowed.`);
      return;
    }
    setImages((prev) => [...prev, { url: manualUrl.trim(), name: `Web Photo ${prev.length + 1}` }]);
    setManualUrl("");
    setShowUrlInput(false);
    setUploadError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleSetCoverPhoto = (index: number) => {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const url = item
        ? `/api/cafe/${cafeSlug}/menu-items/${item.id}`
        : `/api/cafe/${cafeSlug}/menu-items`;
      const method = item ? "PATCH" : "POST";

      const isVeg = foodType === "VEG" || foodType === "VEGAN";
      const finalSlug = (slug || name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;

      const serializedImages = serializeMenuItemImages(images.map((img) => img.url));

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          name: name.trim(),
          slug: finalSlug,
          description: description.trim() || null,
          price: parseInt(price) || 0,
          foodType,
          isVegetarian: isVeg,
          isBestseller,
          isSpicy,
          temperature,
          allergens: allergens.trim() ? allergens.trim() : null,
          calories: calories ? parseInt(calories) : null,
          proteinGrams: protein ? parseInt(protein) : null,
          fatGrams: fat ? parseInt(fat) : null,
          carbsGrams: carbs ? parseInt(carbs) : null,
          imageKey: serializedImages,
          isAvailable,
          preparationTimeMinutes: prepTime.trim() ? (parseInt(prepTime) || null) : null,
          sortOrder: parseInt(sortOrder) || 0,
          modifierGroupIds: selectedGroupIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to save menu item.");
      }

      toast({
        title: "Item Saved",
        description: `"${name}" has been ${item ? "updated" : "added to the menu"}.`,
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

  const renderGroupForm = (isEditing: boolean) => (
    <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border-2 border-[var(--color-primary)] shadow-sm space-y-3 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--color-foreground)]">
            {isEditing ? "Edit Customization Group" : "New Customization Group"}
          </span>
          {isEditing && (
            <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              Editing: {newGroupName || "Group"}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--color-muted)]">
          {isEditing ? "Updates across your café library" : "Will be saved to your café library"}
        </span>
      </div>

      {createGroupError && (
        <div className="p-2 text-xs rounded bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
          {createGroupError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Input
          label="Group Title *"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="e.g. Choice of Milk, Extra Dips"
        />

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-foreground)] block">
            Selection Type
          </label>
          <select
            value={newGroupSelectionType}
            onChange={(e) =>
              setNewGroupSelectionType(e.target.value as "SINGLE" | "MULTIPLE")
            }
            className="w-full h-8 px-2.5 text-xs rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
          >
            <option value="SINGLE">Single Choice (Customer picks 1)</option>
            <option value="MULTIPLE">Multiple Choice (Customer can pick any)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
        <Input
          label="Description / Hint (optional)"
          value={newGroupDescription}
          onChange={(e) => setNewGroupDescription(e.target.value)}
          placeholder="e.g. Choose your chicken style"
        />

        <div className="pb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newGroupIsRequired}
              onChange={(e) => setNewGroupIsRequired(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[var(--color-primary)] border-[var(--color-border-subtle)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-xs font-medium text-[var(--color-foreground)]">
              Required Selection
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              (Customer must pick at least 1)
            </span>
          </label>
        </div>
      </div>

      {/* Options List with Dietary Type */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--color-foreground)]">
            Options, Dietary & Extra Price
          </span>
          <button
            type="button"
            onClick={handleAddNewOptionRow}
            className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
          >
            <IconPlus className="w-3 h-3" />
            <span>Add Option</span>
          </button>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {newGroupOptions.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {/* Dietary Selector */}
              <select
                value={opt.dietaryType || "VEG"}
                onChange={(e) =>
                  handleOptionRowChange(idx, "dietaryType", e.target.value)
                }
                className="h-8 px-2 text-xs rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-foreground)] font-medium cursor-pointer shrink-0"
                title="Dietary Preference"
              >
                <option value="VEG">🟢 Veg</option>
                <option value="NON_VEG">🔴 Non-Veg</option>
                <option value="EGG">🟡 Egg</option>
                <option value="VEGAN">🌱 Vegan</option>
                <option value="NONE">⚪ None</option>
              </select>

              <input
                type="text"
                placeholder="Option name (e.g. peri peri chicken)"
                value={opt.name}
                onChange={(e) => handleOptionRowChange(idx, "name", e.target.value)}
                className="flex-1 h-8 px-2.5 text-xs rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
              />
              <div className="relative w-24 shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-muted)] font-mono">
                  +₹
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={opt.priceDelta}
                  onChange={(e) =>
                    handleOptionRowChange(idx, "priceDelta", e.target.value)
                  }
                  className="w-full h-8 pl-7 pr-2 text-xs rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-foreground)] font-mono"
                />
              </div>
              {newGroupOptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOptionRow(idx)}
                  className="w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] cursor-pointer shrink-0"
                  title="Delete Option"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleCancelGroupForm}
          disabled={isSavingNewGroup}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={handleSaveGroup}
          isLoading={isSavingNewGroup}
        >
          {isEditing ? "Update Group" : "Save & Link Group"}
        </Button>
      </div>
    </div>
  );

  const stepLabels = [
    { num: 1, label: "Basics & Price" },
    { num: 2, label: "Photos & Dietary" },
    { num: 3, label: "Details & Stock" },
    { num: 4, label: "Customizations" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Edit: ${item.name}` : "Add New Menu Item"}
      maxWidth="lg"
    >
      <div className="space-y-3.5">
        {/* Step Progress Bar Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border-subtle)]">
          {stepLabels.map((s) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep) {
                    setCurrentStep(s.num as 1 | 2 | 3 | 4);
                    setError(null);
                  } else if (validateStep(currentStep)) {
                    setCurrentStep(s.num as 1 | 2 | 3 | 4);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                  isActive
                    ? "font-bold text-[var(--color-primary)]"
                    : isDone
                    ? "text-[var(--color-success)] font-medium"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                      : isDone
                      ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                      : "bg-[var(--color-background-subtle)] text-[var(--color-muted)]"
                  }`}
                >
                  {isDone ? <IconCheck className="w-3 h-3" /> : s.num}
                </div>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-3 text-xs rounded-[var(--radius-card)] bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Basics & Price */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Item Name *"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!item && !slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }
                  }}
                  placeholder="e.g. Truffle Mushroom Risotto"
                  required
                />

                <Select
                  label="Category *"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Price (₹) *"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150"
                  required
                />

                <Input
                  label="Est. Prep Time (mins)"
                  type="number"
                  min="1"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="10"
                />
              </div>

              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Delicious creamy risotto finished with parmesan and white truffle oil..."
                rows={2}
              />

              {/* Step 1 Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border-subtle)]">
                <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="button" onClick={handleNext}>
                  <span>Next: Photos & Dietary</span>
                  <IconArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Photos & Dietary */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              {/* Dietary Classification */}
              <div>
                <label className="text-xs font-semibold text-[var(--color-foreground)] block mb-1.5">
                  Dietary Classification *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: "VEG", label: "Vegetarian", icon: IconLeaf, color: "text-emerald-700 bg-emerald-50 border-emerald-300" },
                      { id: "NON_VEG", label: "Non-Veg", icon: IconFlame, color: "text-rose-700 bg-rose-50 border-rose-300" },
                      { id: "EGG", label: "Egg", icon: IconStar, color: "text-amber-700 bg-amber-50 border-amber-300" },
                      { id: "VEGAN", label: "Vegan", icon: IconLeaf, color: "text-teal-700 bg-teal-50 border-teal-300" },
                    ] as const
                  ).map((type) => {
                    const isSelected = foodType === type.id;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFoodType(type.id)}
                        className={`flex items-center gap-2 p-2 rounded-[var(--radius-card)] border text-xs font-semibold transition-all cursor-pointer select-none ${
                          isSelected
                            ? `${type.color} ring-2 ring-[var(--color-primary)] shadow-2xs`
                            : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] text-[var(--color-foreground)] hover:bg-[var(--color-background-subtle)]"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Gallery & Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-foreground)] flex items-center gap-1.5">
                      <IconPhoto className="w-4 h-4 text-[var(--color-primary)]" />
                      <span>Item Photos (Max {MAX_IMAGES_PER_ITEM})</span>
                    </label>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      First photo is the cover. Up to 5 MB per image (12 MB total).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput((prev) => !prev)}
                    className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>{showUrlInput ? "Hide Web URL" : "+ Add by Web URL"}</span>
                  </button>
                </div>

                {uploadError && (
                  <div className="p-2 text-xs rounded bg-[var(--color-danger-light)] text-[var(--color-danger)] font-medium">
                    {uploadError}
                  </div>
                )}

                {/* Web URL input option */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 p-2 rounded-[var(--radius-card)] bg-[var(--color-background-subtle)] border border-[var(--color-border-subtle)]">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      className="flex-1 text-xs h-8 px-2.5 rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
                    />
                    <Button size="sm" type="button" onClick={handleAddManualUrl}>
                      Add URL
                    </Button>
                  </div>
                )}

                {/* Upload drag-and-drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[var(--radius-card)] p-4 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]/20"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] bg-[var(--color-background-subtle)]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleFilesUpload(e.target.files);
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-primary)] font-medium">
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading photos...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] shadow-2xs">
                          <IconUpload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-[var(--color-foreground)] mt-0.5">
                          Click to select photos or drag & drop here
                        </p>
                        <p className="text-[10.5px] text-[var(--color-muted)]">
                          PNG, JPG, WEBP • Max 5 MB each
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Photos Thumbnails list with Cover badge & delete */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-surface)] aspect-square"
                      >
                        <img
                          src={img.url}
                          alt={img.name || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[var(--color-primary)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs select-none">
                            Cover
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCoverPhoto(idx);
                              }}
                              className="p-1 rounded bg-white text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-white text-[10px] font-bold shadow-2xs"
                              title="Make Cover Photo"
                            >
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="p-1 rounded bg-[var(--color-danger)] text-white hover:opacity-90 shadow-2xs"
                            title="Delete Photo"
                          >
                            <IconX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border-subtle)]">
                <Button variant="outline" size="sm" type="button" onClick={handleBack}>
                  <IconArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  <span>Back</span>
                </Button>
                <Button variant="primary" size="sm" type="button" onClick={handleNext}>
                  <span>Next: Details & Stock</span>
                  <IconArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Details & Stock */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              {/* Availability & Bestseller Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-[var(--radius-card)] bg-[var(--color-background-subtle)] border border-[var(--color-border-subtle)]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-primary)] border-[var(--color-border-subtle)] focus:ring-[var(--color-primary)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-foreground)] block">
                      In Stock / Available
                    </span>
                    <span className="text-[10.5px] text-[var(--color-muted)]">
                      Turn off if sold out today
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--color-primary)] border-[var(--color-border-subtle)] focus:ring-[var(--color-primary)]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[var(--color-foreground)] block">
                      Bestseller Badge ⭐
                    </span>
                    <span className="text-[10.5px] text-[var(--color-muted)]">
                      Highlight with a special badge on menu
                    </span>
                  </div>
                </label>
              </div>

              {/* Serving Temperature & Spicy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Serving Temperature"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value as ServingTemperature)}
                  options={[
                    { label: "Not Applicable", value: "NOT_APPLICABLE" },
                    { label: "🔥 Hot", value: "HOT" },
                    { label: "❄️ Cold / Iced", value: "COLD" },
                    { label: "☕ Room Temperature", value: "ROOM_TEMP" },
                  ]}
                />

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSpicy}
                      onChange={(e) => setIsSpicy(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--color-danger)] border-[var(--color-border-subtle)] focus:ring-[var(--color-danger)]"
                    />
                    <span className="text-xs font-semibold text-[var(--color-foreground)] flex items-center gap-1">
                      <IconFlame className="w-3.5 h-3.5 text-rose-500" />
                      <span>Spicy Item (Show chili pepper icon)</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Allergens Notice */}
              <Input
                label="Allergens Notice"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="e.g. Milk, Soy, Gluten, Peanuts"
              />

              {/* Nutritional Breakdown */}
              <div>
                <label className="text-xs font-semibold text-[var(--color-foreground)] block mb-1.5">
                  Nutritional Breakdown (Optional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    label="Calories (kcal)"
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="350"
                  />
                  <Input
                    label="Protein (g)"
                    type="number"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="12"
                  />
                  <Input
                    label="Fat (g)"
                    type="number"
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="8"
                  />
                  <Input
                    label="Carbs (g)"
                    type="number"
                    min="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="45"
                  />
                </div>
              </div>

              {/* Collapsible Advanced Settings */}
              <details className="text-xs text-[var(--color-muted)] pt-0.5 group">
                <summary className="cursor-pointer font-medium hover:text-[var(--color-foreground)] select-none list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform">▸</span>
                  <span>Advanced (Custom URL slug & sort order)</span>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 pl-3 border-l-2 border-[var(--color-border-subtle)] mt-1">
                  <Input
                    label="Custom URL Slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated from name"
                  />
                  <Input
                    label="Display Position (Sort Order)"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
              </details>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border-subtle)]">
                <Button variant="outline" size="sm" type="button" onClick={handleBack}>
                  <IconArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  <span>Back</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" type="submit" isLoading={isLoading}>
                    {item ? "Quick Save" : "Save Item"}
                  </Button>
                  <Button variant="primary" size="sm" type="button" onClick={handleNext}>
                    <span>Next: Customizations</span>
                    <IconArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Customizations (Add-ons & Options) */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-foreground)] flex items-center gap-1.5">
                    <IconAdjustmentsHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Customization Groups</span>
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    Link add-on groups like Milk Choice, Extra Dips, Cheese or Crust to this item.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (showCreateGroup && !editingGroupId) {
                      handleCancelGroupForm();
                    } else {
                      handleStartCreateGroup();
                    }
                  }}
                  className="text-xs shrink-0"
                >
                  <IconPlus className="w-3.5 h-3.5 mr-1" />
                  <span>{showCreateGroup && !editingGroupId ? "Close Form" : "Create Group"}</span>
                </Button>
              </div>

              {/* Top Create Group Form (Only when creating a brand new group) */}
              {showCreateGroup && !editingGroupId && renderGroupForm(false)}

              {/* List of Available Cafe Modifier Groups */}
              {isLoadingModifiers ? (
                <div className="p-6 text-center text-xs text-[var(--color-muted)] flex items-center justify-center gap-2">
                  <IconLoader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                  <span>Loading customizations...</span>
                </div>
              ) : availableModifierGroups.length === 0 && !showCreateGroup ? (
                <div className="p-6 text-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] space-y-2">
                  <p className="text-xs text-[var(--color-muted)]">
                    No customization groups created for your café yet.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleStartCreateGroup}
                  >
                    <IconPlus className="w-3.5 h-3.5 mr-1.5" />
                    <span>Create Your First Group</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableModifierGroups.map((group) => {
                    // When this group is being edited, render the form right in place!
                    if (editingGroupId === group.id) {
                      return (
                        <div key={group.id} className="scroll-mt-4">
                          {renderGroupForm(true)}
                        </div>
                      );
                    }

                    const isLinked = selectedGroupIds.includes(group.id);
                    const isConfirmingDelete = confirmDeleteGroupId === group.id;

                    return (
                      <div
                        key={group.id}
                        className={`p-3 rounded-[var(--radius-card)] border transition-all ${
                          isLinked
                            ? "bg-[var(--color-surface)] border-[var(--color-primary)] shadow-2xs"
                            : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Left: Checkbox & Name / Badges (clickable) */}
                          <label className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isLinked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroupIds((prev) => [...prev, group.id]);
                                } else {
                                  setSelectedGroupIds((prev) => prev.filter((id) => id !== group.id));
                                }
                              }}
                              className="mt-0.5 w-4 h-4 rounded text-[var(--color-primary)] border-[var(--color-border-subtle)] focus:ring-[var(--color-primary)] shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[var(--color-foreground)]">
                                  {group.name}
                                </span>
                                <span
                                  className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded-full ${
                                    group.isRequired
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {group.isRequired ? "Required" : "Optional"}
                                </span>
                                <span className="text-[9.5px] font-medium text-[var(--color-muted)]">
                                  {group.selectionType === "SINGLE" ? "Single Choice" : "Multi-Choice"}
                                </span>
                              </div>
                              {group.description && (
                                <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                                  {group.description}
                                </p>
                              )}
                            </div>
                          </label>

                          {/* Right: Actions (Edit & Delete) */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditGroup(group);
                              }}
                              title="Edit Group"
                              className="p-1.5 rounded-[var(--radius-button)] transition-colors cursor-pointer text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                            >
                              <IconEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteGroupId((prev) => (prev === group.id ? null : group.id));
                              }}
                              title="Delete Group"
                              className="p-1.5 rounded-[var(--radius-button)] transition-colors cursor-pointer text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Options preview with dietary indicator */}
                        <div className="flex flex-wrap gap-1.5 mt-2 pl-7">
                          {group.options.map((opt) => {
                            const dt =
                              (opt as any).dietaryType ||
                              (opt.name.toLowerCase().includes("chiken") ||
                              opt.name.toLowerCase().includes("chicken") ||
                              opt.name.toLowerCase().includes("meat") ||
                              opt.name.toLowerCase().includes("bacon") ||
                              opt.name.toLowerCase().includes("fish")
                                ? "NON_VEG"
                                : (opt.name.toLowerCase().includes("tissue") ||
                                   opt.name.toLowerCase().includes("napkin"))
                                ? "NONE"
                                : "VEG");

                            return (
                              <span
                                key={opt.id}
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-background-subtle)] text-[var(--color-foreground)] border border-[var(--color-border-subtle)]"
                              >
                                {dt === "NON_VEG" && <span className="text-[9px]">🔴</span>}
                                {dt === "VEG" && <span className="text-[9px]">🟢</span>}
                                {dt === "EGG" && <span className="text-[9px]">🟡</span>}
                                {dt === "VEGAN" && <span className="text-[9px]">🌱</span>}
                                {dt === "NONE" && <span className="text-[9px]">⚪</span>}
                                <span>{opt.name}</span>
                                {opt.priceDelta > 0 && (
                                  <span className="ml-0.5 font-mono text-[var(--color-primary)] font-bold">
                                    +₹{opt.priceDelta}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>

                        {/* Inline Delete Confirmation */}
                        {isConfirmingDelete && (
                          <div className="mt-2.5 pt-2 border-t border-[var(--color-danger-light)] flex items-center justify-between gap-2 bg-[var(--color-danger-light)]/40 p-2 rounded-[var(--radius-button)] text-xs animate-in fade-in duration-150">
                            <div className="flex items-center gap-1.5 text-[var(--color-danger)] font-medium text-[11px] truncate">
                              <IconTrash className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Delete &quot;{group.name}&quot; from café?</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteGroupId(null)}
                                disabled={isDeletingGroupId === group.id}
                                className="px-2 py-0.5 text-[11px] font-medium rounded text-[var(--color-muted)] hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                disabled={isDeletingGroupId === group.id}
                                className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-[var(--color-danger)] text-white hover:opacity-90 cursor-pointer transition-opacity flex items-center gap-1 shadow-2xs"
                              >
                                {isDeletingGroupId === group.id ? (
                                  <IconLoader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 4 Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-border-subtle)]">
                <Button variant="outline" size="sm" type="button" onClick={handleBack}>
                  <IconArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  <span>Back</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
                    {item ? "Save Changes" : "Add to Menu"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};
