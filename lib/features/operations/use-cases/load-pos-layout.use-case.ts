import type { OperationsRepository } from "../repositories/operations.repository";

export async function loadPosLayoutUseCase(repository: OperationsRepository) {
  return repository.loadLayoutForCurrentUser();
}
