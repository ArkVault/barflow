import type { Product, Sale, SaleItem, Section } from "@/components/pos/types";

export type CreateSaleInput = {
  establishmentId: string;
  tableName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
};

export type ProductLoadResult = {
  products: Product[];
  categories: string[];
};

export interface OperationsRepository {
  fetchProductsForEstablishment(establishmentId: string): Promise<ProductLoadResult>;
  loadLayoutForCurrentUser(): Promise<Section[] | null>;
  saveLayoutForCurrentUser(sections: Section[]): Promise<void>;
  fetchSales(establishmentId: string): Promise<Sale[]>;
  createSale(input: CreateSaleInput): Promise<void>;
}
