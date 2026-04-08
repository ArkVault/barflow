import type {
  Account,
  AccountItem,
  AccountStatus,
  BarItem,
  Section,
  Status,
  TableItem,
} from "@/components/pos/types";

type PosItemType = "table" | "bar";

function updateTargetItem(
  section: Section,
  sectionId: string,
  itemId: string,
  type: PosItemType,
  updater: (item: TableItem | BarItem) => TableItem | BarItem,
): Section {
  if (section.id !== sectionId) return section;

  if (type === "table") {
    return {
      ...section,
      tables: section.tables.map((item) =>
        item.id === itemId ? (updater(item) as TableItem) : item,
      ),
    };
  }

  return {
    ...section,
    bars: section.bars.map((item) =>
      item.id === itemId ? (updater(item) as BarItem) : item,
    ),
  };
}

export function openNewAccountInSections(
  sections: Section[],
  sectionId: string,
  itemId: string,
  type: PosItemType,
): Section[] {
  return sections.map((section) =>
    updateTargetItem(section, sectionId, itemId, type, (item) => {
      const accountNumber = item.accounts.length + 1;
      const newAccount: Account = {
        id: `acc-${Date.now()}`,
        status: "abierta",
        openedAt: new Date(),
        items: [],
        total: 0,
        seatLabel:
          type === "bar"
            ? `Asiento ${accountNumber}`
            : `Cuenta ${accountNumber}`,
      };

      return {
        ...item,
        status: "ocupada" as Status,
        accounts: [...item.accounts, newAccount],
        currentAccountId: newAccount.id,
      };
    }),
  );
}

export function findAccountToClose(
  sections: Section[],
  sectionId: string,
  itemId: string,
  accountId: string,
  type: PosItemType,
): { account: Account; itemName: string } | null {
  const targetSection = sections.find((section) => section.id === sectionId);
  if (!targetSection) return null;

  const items = type === "table" ? targetSection.tables : targetSection.bars;
  const targetItem = items.find((item) => item.id === itemId);
  if (!targetItem) return null;

  const account = targetItem.accounts.find((acc) => acc.id === accountId);
  if (!account) return null;

  return { account, itemName: targetItem.name };
}

export function closeAccountInSections(
  sections: Section[],
  sectionId: string,
  itemId: string,
  accountId: string,
  type: PosItemType,
): Section[] {
  return sections.map((section) =>
    updateTargetItem(section, sectionId, itemId, type, (item) => {
      const updatedAccounts = item.accounts.filter(
        (acc) => acc.id !== accountId,
      );
      const hasOpenAccounts = updatedAccounts.some(
        (acc) => acc.status !== "pagada",
      );

      return {
        ...item,
        status: hasOpenAccounts ? item.status : ("libre" as Status),
        accounts: updatedAccounts,
        currentAccountId:
          updatedAccounts.length > 0
            ? updatedAccounts[updatedAccounts.length - 1].id
            : undefined,
      };
    }),
  );
}

export function cancelAccountInSections(
  sections: Section[],
  sectionId: string,
  itemId: string,
  accountId: string,
  type: PosItemType,
): Section[] {
  return sections.map((section) =>
    updateTargetItem(section, sectionId, itemId, type, (item) => {
      const updatedAccounts = item.accounts.filter(
        (acc) => acc.id !== accountId,
      );
      const hasOpenAccounts = updatedAccounts.length > 0;

      return {
        ...item,
        status: hasOpenAccounts ? item.status : ("libre" as Status),
        accounts: updatedAccounts,
        currentAccountId:
          updatedAccounts.length > 0
            ? updatedAccounts[updatedAccounts.length - 1].id
            : undefined,
      };
    }),
  );
}

export function removeItemFromAccountInSections(
  sections: Section[],
  sectionId: string,
  itemId: string,
  accountId: string,
  itemToRemoveId: string,
  type: PosItemType,
): Section[] {
  return sections.map((section) =>
    updateTargetItem(section, sectionId, itemId, type, (item) => ({
      ...item,
      accounts: item.accounts.map((account) => {
        if (account.id !== accountId) return account;

        const updatedItems = account.items.filter(
          (accItem) => accItem.id !== itemToRemoveId,
        );
        const newTotal = updatedItems.reduce(
          (sum, accItem) => sum + accItem.total,
          0,
        );

        return {
          ...account,
          items: updatedItems,
          total: newTotal,
        };
      }),
    })),
  );
}

export function sendOrderToTargetInSections(
  sections: Section[],
  sectionId: string,
  itemId: string,
  type: PosItemType,
  currentOrder: AccountItem[],
): Section[] {
  return sections.map((section) =>
    updateTargetItem(section, sectionId, itemId, type, (item) => {
      let targetAccount = item.accounts.find(
        (acc) => acc.id === item.currentAccountId,
      );

      if (!targetAccount) {
        targetAccount = {
          id: `acc-${Date.now()}`,
          status: "en-consumo",
          openedAt: new Date(),
          items: [],
          total: 0,
        };
      }

      const updatedItems = [...targetAccount.items, ...currentOrder];
      const newTotal = updatedItems.reduce(
        (sum, orderItem) => sum + orderItem.total,
        0,
      );

      const nextAccounts = item.accounts.some(
        (acc) => acc.id === targetAccount!.id,
      )
        ? item.accounts.map((acc) =>
            acc.id === targetAccount!.id
              ? {
                  ...acc,
                  items: updatedItems,
                  total: newTotal,
                  status: "en-consumo" as AccountStatus,
                }
              : acc,
          )
        : [
            ...item.accounts,
            {
              ...targetAccount,
              items: updatedItems,
              total: newTotal,
              status: "en-consumo" as AccountStatus,
            },
          ];

      return {
        ...item,
        status: "ocupada" as Status,
        accounts: nextAccounts,
        currentAccountId: targetAccount.id,
      };
    }),
  );
}
