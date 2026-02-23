import test from "node:test";
import assert from "node:assert/strict";
import {
  cancelAccountInSections,
  closeAccountInSections,
  findAccountToClose,
  openNewAccountInSections,
  removeItemFromAccountInSections,
  sendOrderToTargetInSections,
} from "./pos-state.domain";
import type { Account, AccountItem, Section } from "@/components/pos/types";

function makeOrderItem(id: string, total: number): AccountItem {
  return {
    id,
    productName: `Producto ${id}`,
    quantity: 1,
    unitPrice: total,
    total,
    timestamp: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function makeAccount(id: string, status: Account["status"], items: AccountItem[] = []): Account {
  return {
    id,
    status,
    openedAt: new Date("2026-01-01T00:00:00.000Z"),
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

function makeSections(): Section[] {
  return [
    {
      id: "sec-1",
      name: "Seccion 1",
      x: 0,
      y: 0,
      width: 500,
      height: 400,
      tables: [
        {
          id: "table-1",
          name: "Mesa 1",
          x: 10,
          y: 10,
          status: "libre",
          accounts: [],
        },
      ],
      bars: [
        {
          id: "bar-1",
          name: "Barra 1",
          x: 50,
          y: 300,
          status: "libre",
          accounts: [],
          orientation: "horizontal",
        },
      ],
    },
  ];
}

test("openNewAccountInSections opens table account and marks occupied", () => {
  const updated = openNewAccountInSections(makeSections(), "sec-1", "table-1", "table");
  const table = updated[0].tables[0];

  assert.equal(table.status, "ocupada");
  assert.equal(table.accounts.length, 1);
  assert.ok(table.currentAccountId);
  assert.equal(table.accounts[0].seatLabel, undefined);
});

test("openNewAccountInSections sets seat label for bar accounts", () => {
  const updated = openNewAccountInSections(makeSections(), "sec-1", "bar-1", "bar");
  const bar = updated[0].bars[0];

  assert.equal(bar.status, "ocupada");
  assert.equal(bar.accounts.length, 1);
  assert.equal(bar.accounts[0].seatLabel, "Asiento 1");
});

test("findAccountToClose returns account metadata when account exists", () => {
  const sections = makeSections();
  const account = makeAccount("acc-1", "en-consumo", [makeOrderItem("1", 20)]);
  sections[0].tables[0].accounts = [account];

  const found = findAccountToClose(sections, "sec-1", "table-1", "acc-1", "table");

  assert.ok(found);
  assert.equal(found?.itemName, "Mesa 1");
  assert.equal(found?.account.id, "acc-1");
});

test("findAccountToClose returns null when account is missing", () => {
  const found = findAccountToClose(makeSections(), "sec-1", "table-1", "missing", "table");
  assert.equal(found, null);
});

test("closeAccountInSections frees item when no open accounts remain", () => {
  const sections = makeSections();
  sections[0].tables[0].status = "ocupada";
  sections[0].tables[0].accounts = [makeAccount("acc-1", "pagada")];
  sections[0].tables[0].currentAccountId = "acc-1";

  const updated = closeAccountInSections(sections, "sec-1", "table-1", "acc-1", "table");
  const table = updated[0].tables[0];

  assert.equal(table.status, "libre");
  assert.equal(table.accounts.length, 0);
  assert.equal(table.currentAccountId, undefined);
});

test("cancelAccountInSections keeps occupied status when another account remains", () => {
  const sections = makeSections();
  sections[0].tables[0].status = "ocupada";
  sections[0].tables[0].accounts = [
    makeAccount("acc-1", "abierta"),
    makeAccount("acc-2", "en-consumo"),
  ];
  sections[0].tables[0].currentAccountId = "acc-2";

  const updated = cancelAccountInSections(sections, "sec-1", "table-1", "acc-1", "table");
  const table = updated[0].tables[0];

  assert.equal(table.status, "ocupada");
  assert.equal(table.accounts.length, 1);
  assert.equal(table.accounts[0].id, "acc-2");
  assert.equal(table.currentAccountId, "acc-2");
});

test("removeItemFromAccountInSections recalculates account total", () => {
  const sections = makeSections();
  sections[0].tables[0].accounts = [
    makeAccount("acc-1", "en-consumo", [makeOrderItem("1", 10), makeOrderItem("2", 15)]),
  ];

  const updated = removeItemFromAccountInSections(
    sections,
    "sec-1",
    "table-1",
    "acc-1",
    "1",
    "table"
  );
  const account = updated[0].tables[0].accounts[0];

  assert.equal(account.items.length, 1);
  assert.equal(account.items[0].id, "2");
  assert.equal(account.total, 15);
});

test("sendOrderToTargetInSections appends order to current account", () => {
  const sections = makeSections();
  sections[0].tables[0].status = "ocupada";
  sections[0].tables[0].accounts = [makeAccount("acc-1", "abierta", [makeOrderItem("old", 12)])];
  sections[0].tables[0].currentAccountId = "acc-1";

  const updated = sendOrderToTargetInSections(
    sections,
    "sec-1",
    "table-1",
    "table",
    [makeOrderItem("new", 8)]
  );
  const table = updated[0].tables[0];
  const account = table.accounts[0];

  assert.equal(table.status, "ocupada");
  assert.equal(account.status, "en-consumo");
  assert.equal(account.items.length, 2);
  assert.equal(account.total, 20);
});

test("sendOrderToTargetInSections creates account when currentAccountId is missing", () => {
  const updated = sendOrderToTargetInSections(
    makeSections(),
    "sec-1",
    "table-1",
    "table",
    [makeOrderItem("new", 8)]
  );
  const table = updated[0].tables[0];

  assert.equal(table.status, "ocupada");
  assert.equal(table.accounts.length, 1);
  assert.ok(table.currentAccountId);
  assert.equal(table.accounts[0].status, "en-consumo");
  assert.equal(table.accounts[0].total, 8);
});
