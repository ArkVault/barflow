import type { Supply } from "@/types/supply";

export interface DisplayQuantity {
  value: number;
  unit: string;
  formatted: string;
}

export function formatDisplayQuantity(value: number, unit: string): string {
  const formattedValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formattedValue} ${unit}`;
}

export function getDisplayQuantity(supply: Supply): DisplayQuantity {
  if (!supply.content_per_unit || supply.content_per_unit <= 0) {
    const value = supply.current_quantity;
    const unit = supply.unit;
    return { value, unit, formatted: formatDisplayQuantity(value, unit) };
  }

  const units = supply.current_quantity / supply.content_per_unit;
  const category = supply.category?.toLowerCase() || "";
  const contentUnit = supply.content_unit?.toLowerCase() || supply.unit?.toLowerCase() || "";

  let value = units;
  let unit = "unidades";

  if (category.includes("otro") || category === "otros") {
    value = supply.current_quantity;
    unit = "g";
  } else if (category.includes("fruta") || category.includes("fruit")) {
    value = supply.current_quantity / 1000;
    unit = "kg";
  } else if (category.includes("especia") || category.includes("spice")) {
    const kg = supply.current_quantity / 1000;
    if (kg < 1) {
      value = supply.current_quantity;
      unit = "g";
    } else {
      value = kg;
      unit = "kg";
    }
  } else if (
    category.includes("licor") ||
    category.includes("alcohol") ||
    (category.includes("bebida") && contentUnit.includes("ml"))
  ) {
    value = units;
    unit = Math.floor(units) === 1 ? "botella" : "botellas";
  } else if (
    category.includes("refresco") ||
    category.includes("no alcohólica") ||
    category.includes("agua")
  ) {
    if (contentUnit === "l" || supply.content_per_unit >= 1000) {
      value = supply.current_quantity / 1000;
      unit = value === 1 ? "litro" : "litros";
    } else {
      value = units;
      unit = Math.floor(units) === 1 ? "botella" : "botellas";
    }
  } else if (contentUnit === "ml" || contentUnit === "l") {
    value = units;
    unit = Math.floor(units) === 1 ? "botella" : "botellas";
  } else if (contentUnit === "g") {
    value = supply.current_quantity / 1000;
    unit = "kg";
  } else if (contentUnit === "kg") {
    value = supply.current_quantity;
    unit = "kg";
  }

  return { value, unit, formatted: formatDisplayQuantity(value, unit) };
}

export function getOptimalDisplayQuantity(supply: Supply): DisplayQuantity | null {
  if (supply.optimal_quantity == null) return null;

  if (!supply.content_per_unit || supply.content_per_unit <= 0) {
    const value = supply.optimal_quantity;
    const unit = supply.unit;
    return { value, unit, formatted: formatDisplayQuantity(value, unit) };
  }

  const optimalUnits = supply.optimal_quantity / supply.content_per_unit;
  const category = supply.category?.toLowerCase() || "";
  const contentUnit = supply.content_unit?.toLowerCase() || supply.unit?.toLowerCase() || "";

  let value = optimalUnits;
  let unit = "unidades";

  if (category.includes("otro") || category === "otros") {
    value = supply.optimal_quantity;
    unit = "g";
  } else if (category.includes("fruta") || category.includes("fruit")) {
    value = supply.optimal_quantity / 1000;
    unit = "kg";
  } else if (category.includes("especia") || category.includes("spice")) {
    const kg = supply.optimal_quantity / 1000;
    if (kg < 1) {
      value = supply.optimal_quantity;
      unit = "g";
    } else {
      value = kg;
      unit = "kg";
    }
  } else if (
    category.includes("licor") ||
    category.includes("alcohol") ||
    (category.includes("bebida") && contentUnit.includes("ml"))
  ) {
    value = optimalUnits;
    unit = Math.floor(optimalUnits) === 1 ? "botella" : "botellas";
  } else if (
    category.includes("refresco") ||
    category.includes("no alcohólica") ||
    category.includes("agua")
  ) {
    if (contentUnit === "l" || supply.content_per_unit >= 1000) {
      value = supply.optimal_quantity / 1000;
      unit = value === 1 ? "litro" : "litros";
    } else {
      value = optimalUnits;
      unit = Math.floor(optimalUnits) === 1 ? "botella" : "botellas";
    }
  } else if (contentUnit === "ml" || contentUnit === "l") {
    value = optimalUnits;
    unit = Math.floor(optimalUnits) === 1 ? "botella" : "botellas";
  } else if (contentUnit === "g") {
    value = supply.optimal_quantity / 1000;
    unit = "kg";
  } else if (contentUnit === "kg") {
    value = supply.optimal_quantity;
    unit = "kg";
  }

  return { value, unit, formatted: formatDisplayQuantity(value, unit) };
}
