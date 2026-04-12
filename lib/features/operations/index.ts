export type {
  OperationsRepository,
  ProductLoadResult,
  CreateSaleInput,
} from "./repositories/operations.repository";

export { createSupabaseOperationsRepository } from "./repositories/supabase-operations.repository";

export { fetchPosProductsUseCase } from "./use-cases/fetch-pos-products.use-case";
export { loadPosLayoutUseCase } from "./use-cases/load-pos-layout.use-case";
export { savePosLayoutUseCase } from "./use-cases/save-pos-layout.use-case";
export { fetchPosSalesUseCase } from "./use-cases/fetch-pos-sales.use-case";
export { recordPosSaleUseCase } from "./use-cases/record-pos-sale.use-case";

export {
  openNewAccountInSections,
  findAccountToClose,
  closeAccountInSections,
  cancelAccountInSections,
  removeItemFromAccountInSections,
  moveItemBetweenAccountsInSections,
  sendOrderToTargetInSections,
} from "./domain/pos-state.domain";
