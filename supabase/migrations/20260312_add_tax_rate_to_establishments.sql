-- Add configurable tax rate to establishments
-- Default of 16.00 preserves existing behavior for all current rows (Mexican IVA standard rate)
-- Border zone establishments can update this to 8.00; export or tax-exempt to 0.00

ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) NOT NULL DEFAULT 16.00;
