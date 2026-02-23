import { createClient } from "@/lib/supabase/client";
import type { Product, Sale, Section } from "@/components/pos/types";
import type {
  CreateSaleInput,
  OperationsRepository,
  ProductLoadResult,
} from "./operations.repository";

function deserializeSections(sections: any[]): Section[] {
  return sections.map((section: any) => ({
    ...section,
    tables: section.tables.map((table: any) => ({
      ...table,
      accounts: (table.accounts || []).map((acc: any) => ({
        ...acc,
        openedAt: new Date(acc.openedAt),
        closedAt: acc.closedAt ? new Date(acc.closedAt) : undefined,
        items: (acc.items || []).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      })),
    })),
    bars: section.bars.map((bar: any) => ({
      ...bar,
      accounts: (bar.accounts || []).map((acc: any) => ({
        ...acc,
        openedAt: new Date(acc.openedAt),
        closedAt: acc.closedAt ? new Date(acc.closedAt) : undefined,
        items: (acc.items || []).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      })),
    })),
  }));
}

function serializeSections(sections: Section[]) {
  return sections.map((section) => ({
    ...section,
    tables: section.tables.map((table) => ({
      ...table,
      accounts: table.accounts.map((acc) => ({
        ...acc,
        openedAt: acc.openedAt instanceof Date ? acc.openedAt.toISOString() : acc.openedAt,
        closedAt: acc.closedAt instanceof Date ? acc.closedAt.toISOString() : acc.closedAt,
        items: acc.items.map((item) => ({
          ...item,
          timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
        })),
      })),
    })),
    bars: section.bars.map((bar) => ({
      ...bar,
      accounts: bar.accounts.map((acc) => ({
        ...acc,
        openedAt: acc.openedAt instanceof Date ? acc.openedAt.toISOString() : acc.openedAt,
        closedAt: acc.closedAt instanceof Date ? acc.closedAt.toISOString() : acc.closedAt,
        items: acc.items.map((item) => ({
          ...item,
          timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
        })),
      })),
    })),
  }));
}

export function createSupabaseOperationsRepository(): OperationsRepository {
  return {
    async fetchProductsForEstablishment(establishmentId: string): Promise<ProductLoadResult> {
      const supabase = createClient();
      const { data: activeMenus } = await supabase
        .from("menus")
        .select("id")
        .eq("establishment_id", establishmentId)
        .or("is_active.eq.true,is_secondary_active.eq.true");

      if (!activeMenus || activeMenus.length === 0) {
        return { products: [], categories: ["Todos"] };
      }

      const menuIds = activeMenus.map((m) => m.id);
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price, category, menu_id, image_url")
        .in("menu_id", menuIds)
        .eq("is_active", true)
        .order("category", { ascending: true });

      const products = (productsData || []) as Product[];
      const categories = ["Todos", ...new Set(products.map((p) => p.category))];
      return { products, categories };
    },

    async loadLayoutForCurrentUser(): Promise<Section[] | null> {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("operations_layout")
        .select("sections, table_counter")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(error.message);
      }

      if (!data?.sections) return null;
      return deserializeSections(data.sections as any[]);
    },

    async saveLayoutForCurrentUser(sections: Section[]): Promise<void> {
      if (sections.length === 0) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const serializedSections = serializeSections(sections);
      const { error } = await supabase.from("operations_layout").upsert(
        {
          user_id: user.id,
          sections: serializedSections,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        throw new Error(error.message);
      }
    },

    async fetchSales(establishmentId: string): Promise<Sale[]> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("establishment_id", establishmentId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []) as Sale[];
    },

    async createSale(input: CreateSaleInput): Promise<void> {
      const supabase = createClient();
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase.from("sales").insert({
        establishment_id: input.establishmentId,
        order_number: orderNumber,
        table_name: input.tableName,
        items: input.items,
        subtotal: input.subtotal,
        tax: input.tax,
        total: input.total,
        payment_method: input.paymentMethod || "pending",
      });

      if (error) {
        throw new Error(error.message);
      }
    },
  };
}
