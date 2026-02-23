import type { OperationsRepository } from "../repositories/operations.repository";

export async function fetchPosProductsUseCase(
  repository: OperationsRepository,
  establishmentId: string
) {
  return repository.fetchProductsForEstablishment(establishmentId);
}
