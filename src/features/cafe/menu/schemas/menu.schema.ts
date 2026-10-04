import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const menuItemSchema = z.object({
  categoryId: z.string().uuid("Please select a valid category"),
  name: z.string().min(2, "Item name must be at least 2 characters").max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(1000).optional().nullable(),
  price: z.coerce.number().int().min(0, "Price must be a positive integer"),
  isAvailable: z.boolean().default(true),
  foodType: z.enum(["VEG", "NON_VEG", "EGG", "VEGAN"]).default("VEG"),
  isVegetarian: z.boolean().default(true),
  isBestseller: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  temperature: z.enum(["HOT", "COLD", "ROOM_TEMP", "NOT_APPLICABLE"]).default("NOT_APPLICABLE"),
  allergens: z.string().max(300).optional().nullable(),
  calories: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  proteinGrams: z.coerce.number().int().min(0).max(500).optional().nullable(),
  fatGrams: z.coerce.number().int().min(0).max(500).optional().nullable(),
  carbsGrams: z.coerce.number().int().min(0).max(1000).optional().nullable(),
  imageKey: z.string().optional().nullable(),
  preparationTimeMinutes: z.coerce.number().int().min(1).max(120).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  modifierGroupIds: z.array(z.string().uuid()).optional(),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
