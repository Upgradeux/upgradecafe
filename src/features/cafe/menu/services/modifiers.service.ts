import { db } from "@/lib/db";
import {
  modifierGroups,
  modifierOptions,
  menuItemModifierGroups,
  ModifierGroup,
  ModifierOption,
  FullModifierGroupWithOption,
} from "@/lib/db/schema/modifiers";
import { menuItems } from "@/lib/db/schema/menu-items";
import { eq, and, asc, inArray } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";

export class ModifiersService {
  /**
   * List all modifier groups belonging to a cafe (with their options)
   */
  static async listCafeModifierGroups(cafeId: string): Promise<FullModifierGroupWithOption[]> {
    const groups = await db
      .select()
      .from(modifierGroups)
      .where(eq(modifierGroups.cafeId, cafeId))
      .orderBy(asc(modifierGroups.sortOrder), asc(modifierGroups.createdAt));

    if (groups.length === 0) return [];

    const groupIds = groups.map((g) => g.id);
    const options = await db
      .select()
      .from(modifierOptions)
      .where(inArray(modifierOptions.modifierGroupId, groupIds))
      .orderBy(asc(modifierOptions.sortOrder), asc(modifierOptions.createdAt));

    return groups.map((g) => ({
      ...g,
      options: options.filter((o) => o.modifierGroupId === g.id),
    }));
  }

  /**
   * List modifier groups assigned to a specific menu item (with their options)
   */
  static async getItemModifierGroups(menuItemId: string): Promise<FullModifierGroupWithOption[]> {
    const links = await db
      .select()
      .from(menuItemModifierGroups)
      .where(eq(menuItemModifierGroups.menuItemId, menuItemId))
      .orderBy(asc(menuItemModifierGroups.sortOrder));

    if (links.length === 0) return [];

    const groupIds = links.map((l) => l.modifierGroupId);
    const groups = await db
      .select()
      .from(modifierGroups)
      .where(inArray(modifierGroups.id, groupIds));

    const options = await db
      .select()
      .from(modifierOptions)
      .where(inArray(modifierOptions.modifierGroupId, groupIds))
      .orderBy(asc(modifierOptions.sortOrder));

    // Preserve the order defined in links
    return links
      .map((l) => {
        const g = groups.find((grp) => grp.id === l.modifierGroupId);
        if (!g) return null;
        return {
          ...g,
          options: options.filter((o) => o.modifierGroupId === g.id),
        };
      })
      .filter((g): g is FullModifierGroupWithOption => g !== null);
  }

  /**
   * Create a new modifier group with options
   */
  static async createModifierGroup(
    cafeId: string,
    data: {
      name: string;
      description?: string;
      selectionType?: "SINGLE" | "MULTIPLE";
      isRequired?: boolean;
      minSelections?: number;
      maxSelections?: number | null;
      options: Array<{
        name: string;
        priceDelta: number;
        dietaryType?: "VEG" | "NON_VEG" | "EGG" | "VEGAN" | "NONE";
        isAvailable?: boolean;
      }>;
    }
  ): Promise<FullModifierGroupWithOption> {
    const [group] = await db
      .insert(modifierGroups)
      .values({
        cafeId,
        name: data.name.trim(),
        description: data.description?.trim(),
        selectionType: data.selectionType || "MULTIPLE",
        isRequired: data.isRequired ?? false,
        minSelections: data.minSelections ?? (data.isRequired ? 1 : 0),
        maxSelections: data.maxSelections ?? (data.selectionType === "SINGLE" ? 1 : null),
      })
      .returning();

    const createdOptions: ModifierOption[] = [];
    if (data.options && data.options.length > 0) {
      const optionsToInsert = data.options
        .map((opt, i) => ({
          modifierGroupId: group.id,
          name: opt.name.trim(),
          priceDelta: Number(opt.priceDelta) || 0,
          dietaryType: opt.dietaryType || "VEG",
          isAvailable: opt.isAvailable ?? true,
          sortOrder: i,
        }))
        .filter((opt) => Boolean(opt.name));

      if (optionsToInsert.length > 0) {
        const inserted = await db
          .insert(modifierOptions)
          .values(optionsToInsert)
          .returning();
        createdOptions.push(...inserted);
      }
    }

    return {
      ...group,
      options: createdOptions,
    };
  }

  /**
   * Update an existing modifier group and replace its options strictly within the cafe tenant
   */
  static async updateModifierGroup(
    groupId: string,
    cafeId: string,
    data: {
      name?: string;
      description?: string;
      selectionType?: "SINGLE" | "MULTIPLE";
      isRequired?: boolean;
      minSelections?: number;
      maxSelections?: number | null;
      options?: Array<{
        id?: string;
        name: string;
        priceDelta: number;
        dietaryType?: "VEG" | "NON_VEG" | "EGG" | "VEGAN" | "NONE";
        isAvailable?: boolean;
      }>;
    }
  ): Promise<FullModifierGroupWithOption> {
    const [group] = await db
      .update(modifierGroups)
      .set({
        name: data.name ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
        selectionType: data.selectionType,
        isRequired: data.isRequired,
        minSelections: data.minSelections,
        maxSelections: data.maxSelections,
        updatedAt: new Date(),
      })
      .where(and(eq(modifierGroups.id, groupId), eq(modifierGroups.cafeId, cafeId)))
      .returning();

    if (!group) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Modifier group not found in this café.",
        statusCode: 404,
      });
    }

    if (data.options) {
      // Delete existing options and insert updated ones
      await db.delete(modifierOptions).where(eq(modifierOptions.modifierGroupId, groupId));

      const createdOptions: ModifierOption[] = [];
      const optionsToInsert = data.options
        .map((opt, i) => ({
          modifierGroupId: groupId,
          name: opt.name.trim(),
          priceDelta: Number(opt.priceDelta) || 0,
          dietaryType: opt.dietaryType || "VEG",
          isAvailable: opt.isAvailable ?? true,
          sortOrder: i,
        }))
        .filter((opt) => Boolean(opt.name));

      if (optionsToInsert.length > 0) {
        const inserted = await db
          .insert(modifierOptions)
          .values(optionsToInsert)
          .returning();
        createdOptions.push(...inserted);
      }

      return {
        ...group,
        options: createdOptions,
      };
    }

    const options = await db
      .select()
      .from(modifierOptions)
      .where(eq(modifierOptions.modifierGroupId, groupId))
      .orderBy(asc(modifierOptions.sortOrder));

    return {
      ...group,
      options,
    };
  }

  /**
   * Delete a modifier group strictly within tenant boundary
   */
  static async deleteModifierGroup(groupId: string, cafeId: string): Promise<boolean> {
    const result = await db
      .delete(modifierGroups)
      .where(and(eq(modifierGroups.id, groupId), eq(modifierGroups.cafeId, cafeId)))
      .returning();
    return result.length > 0;
  }

  /**
   * Sync/link modifier groups to a specific menu item.
   * Validates that both the menu item and all referenced modifier groups belong to the same cafe.
   */
  static async syncItemModifierGroups(
    menuItemId: string,
    cafeId: string,
    modifierGroupIds: string[]
  ): Promise<void> {
    // 1. Verify menu item belongs to this cafe
    const [item] = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(and(eq(menuItems.id, menuItemId), eq(menuItems.cafeId, cafeId)))
      .limit(1);

    if (!item) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Menu item not found in this café.",
        statusCode: 404,
      });
    }

    // 2. Verify all modifier groups belong to this cafe
    if (modifierGroupIds.length > 0) {
      const validGroups = await db
        .select({ id: modifierGroups.id })
        .from(modifierGroups)
        .where(
          and(
            inArray(modifierGroups.id, modifierGroupIds),
            eq(modifierGroups.cafeId, cafeId)
          )
        );

      if (validGroups.length !== new Set(modifierGroupIds).size) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "One or more modifier groups do not belong to this café.",
          statusCode: 400,
        });
      }
    }

    await db
      .delete(menuItemModifierGroups)
      .where(eq(menuItemModifierGroups.menuItemId, menuItemId));

    if (modifierGroupIds.length > 0) {
      await db.insert(menuItemModifierGroups).values(
        modifierGroupIds.map((groupId, i) => ({
          menuItemId,
          modifierGroupId: groupId,
          sortOrder: i,
        }))
      );
    }
  }
}
