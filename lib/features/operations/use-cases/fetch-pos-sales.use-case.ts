import type { OperationsRepository } from "../repositories/operations.repository";

export async function fetchPosSalesUseCase(
  repository: OperationsRepository,
  establishmentId: string
) {
  return repository.fetchSales(establishmentId);
}
