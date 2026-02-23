import type {
  CreateSaleInput,
  OperationsRepository,
} from "../repositories/operations.repository";

export async function recordPosSaleUseCase(
  repository: OperationsRepository,
  input: CreateSaleInput
) {
  await repository.createSale(input);
}
