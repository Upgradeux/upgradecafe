import { db } from "@/lib/db";
import { categories, Category, NewCategory } from "@/lib/db/schema/categories";
import { menuItems, MenuItem, NewMenuItem } from "@/lib/db/schema/menu-items";
import { eq, and, asc, ilike } from "drizzle-orm";
import { AppError } from "@/lib/errors/app-error";
import { ModifiersService } from "./modifiers.service";

export class MenuService {
  /**
   * List all categories for a given cafe tenant, ordered by sortOrder
   */
  static async listCategories(cafeId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.cafeId, cafeId))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  /**
   * Create a new menu category for a cafe
   */
  static async createCategory(cafeId: string, data: Omit<NewCategory, "id" | "cafeId" | "createdAt" | "updatedAt">): Promise<Category> {
    const [created] = await db
      .insert(categories)
      .values({
        ...data,
        cafeId,
      })
      .returning();
    return created;
  }

  /**
   * Update category with tenant boundary check
   */
  static async updateCategory(
    id: string,
    cafeId: string,
    data: Partial<Omit<NewCategory, "id" | "cafeId" | "createdAt" | "updatedAt">>
  ): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.cafeId, cafeId)))
      .returning();

    if (!updated) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Category not found in this café.",
        statusCode: 404,
      });
    }

    return updated;
  }

  /**
   * Delete category with tenant boundary check
   */
  static async deleteCategory(id: string, cafeId: string): Promise<void> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.cafeId, cafeId)))
      .returning();

    if (result.length === 0) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Category not found in this café.",
        statusCode: 404,
      });
    }
  }

  /**
   * List menu items for a cafe with optional category and search filters
   */
  static async listMenuItems(
    cafeId: string,
    params?: { categoryId?: string; search?: string; isAvailable?: boolean }
  ): Promise<Array<MenuItem & { categoryName?: string | null }>> {
    const conditions = [eq(menuItems.cafeId, cafeId)];

    if (params?.categoryId && params.categoryId !== "all") {
      conditions.push(eq(menuItems.categoryId, params.categoryId));
    }

    if (params?.isAvailable !== undefined) {
      conditions.push(eq(menuItems.isAvailable, params.isAvailable));
    }

    if (params?.search && params.search.trim().length > 0) {
      conditions.push(ilike(menuItems.name, `%${params.search.trim()}%`));
    }

    const items = await db
      .select({
        id: menuItems.id,
        cafeId: menuItems.cafeId,
        categoryId: menuItems.categoryId,
        name: menuItems.name,
        slug: menuItems.slug,
        description: menuItems.description,
        price: menuItems.price,
        isAvailable: menuItems.isAvailable,
        isVegetarian: menuItems.isVegetarian,
        foodType: menuItems.foodType,
        isBestseller: menuItems.isBestseller,
        isSpicy: menuItems.isSpicy,
        temperature: menuItems.temperature,
        allergens: menuItems.allergens,
        calories: menuItems.calories,
        proteinGrams: menuItems.proteinGrams,
        fatGrams: menuItems.fatGrams,
        carbsGrams: menuItems.carbsGrams,
        imageKey: menuItems.imageKey,
        preparationTimeMinutes: menuItems.preparationTimeMinutes,
        sortOrder: menuItems.sortOrder,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: categories.name,
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));

    return items;
  }

  /**
   * Create a menu item with tenant boundary
   */
  static async createMenuItem(cafeId: string, data: Omit<NewMenuItem, "id" | "cafeId" | "createdAt" | "updatedAt">): Promise<MenuItem> {
    // Verify category belongs to same cafe
    const [cat] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, data.categoryId), eq(categories.cafeId, cafeId)))
      .limit(1);

    if (!cat) {
      throw new AppError({
        code: "INVALID_CATEGORY",
        message: "Selected category does not exist in this café.",
        statusCode: 400,
      });
    }

    const { modifierGroupIds, ...itemData } = (data as any);

    const [created] = await db
      .insert(menuItems)
      .values({
        ...itemData,
        cafeId,
      })
      .returning();

    if (modifierGroupIds && Array.isArray(modifierGroupIds)) {
      await ModifiersService.syncItemModifierGroups(created.id, modifierGroupIds);
    }

    return created;
  }

  /**
   * Update a menu item with tenant boundary check
   */
  static async updateMenuItem(
    id: string,
    cafeId: string,
    data: Partial<Omit<NewMenuItem, "id" | "cafeId" | "createdAt" | "updatedAt">>
  ): Promise<MenuItem> {
    const { modifierGroupIds, ...itemData } = (data as any);

    if (itemData.categoryId) {
      const [cat] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, itemData.categoryId), eq(categories.cafeId, cafeId)))
        .limit(1);

      if (!cat) {
        throw new AppError({
          code: "INVALID_CATEGORY",
          message: "Selected category does not exist in this café.",
          statusCode: 400,
        });
      }
    }

    const [updated] = await db
      .update(menuItems)
      .set({
        ...itemData,
        updatedAt: new Date(),
      })
      .where(and(eq(menuItems.id, id), eq(menuItems.cafeId, cafeId)))
      .returning();

    if (!updated) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Menu item not found in this café.",
        statusCode: 404,
      });
    }

    if (modifierGroupIds !== undefined && Array.isArray(modifierGroupIds)) {
      await ModifiersService.syncItemModifierGroups(id, modifierGroupIds);
    }

    return updated;
  }

  /**
   * Toggle item live availability (86-ing items instantly from QR menu)
   */
  static async toggleAvailability(id: string, cafeId: string): Promise<MenuItem> {
    const [item] = await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.cafeId, cafeId)))
      .limit(1);

    if (!item) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Menu item not found.",
        statusCode: 404,
      });
    }

    const [updated] = await db
      .update(menuItems)
      .set({
        isAvailable: !item.isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, id))
      .returning();

    return updated;
  }

  /**
   * Delete a menu item
   */
  static async deleteMenuItem(id: string, cafeId: string): Promise<void> {
    const result = await db
      .delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.cafeId, cafeId)))
      .returning();

    if (result.length === 0) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Menu item not found in this café.",
        statusCode: 404,
      });
    }
  }
}
