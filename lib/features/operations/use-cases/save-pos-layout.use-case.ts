import type { Section } from "@/components/pos/types";
import type { OperationsRepository } from "../repositories/operations.repository";

export async function savePosLayoutUseCase(
  repository: OperationsRepository,
  sections: Section[]
) {
  await repository.saveLayoutForCurrentUser(sections);
}
