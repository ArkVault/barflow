-- Gate 3: Transactional batch save for supplies
-- Inserts new supplies and updates existing ones atomically.
-- If any operation fails, all changes are rolled back.

CREATE OR REPLACE FUNCTION public.save_supplies_batch(
  p_establishment_id UUID,
  p_new_supplies JSONB DEFAULT '[]'::JSONB,
  p_update_supplies JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count INT := 0;
  v_updated_count INT := 0;
  v_supply JSONB;
BEGIN
  -- Validate establishment exists
  IF NOT EXISTS (SELECT 1 FROM establishments WHERE id = p_establishment_id) THEN
    RAISE EXCEPTION 'Establishment not found: %', p_establishment_id;
  END IF;

  -- Insert new supplies
  IF jsonb_array_length(p_new_supplies) > 0 THEN
    INSERT INTO supplies (establishment_id, name, category, unit, current_quantity, min_threshold)
    SELECT
      p_establishment_id,
      (elem->>'name')::TEXT,
      (elem->>'category')::TEXT,
      (elem->>'unit')::TEXT,
      COALESCE((elem->>'current_quantity')::NUMERIC, 0),
      COALESCE((elem->>'min_threshold')::NUMERIC, 0)
    FROM jsonb_array_elements(p_new_supplies) AS elem;

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  END IF;

  -- Update existing supplies
  FOR v_supply IN SELECT * FROM jsonb_array_elements(p_update_supplies)
  LOOP
    UPDATE supplies
    SET
      current_quantity = COALESCE((v_supply->>'current_quantity')::NUMERIC, current_quantity),
      updated_at = NOW()
    WHERE id = (v_supply->>'id')::UUID
      AND establishment_id = p_establishment_id;

    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted_count,
    'updated', v_updated_count
  );
END;
$$;

COMMENT ON FUNCTION public.save_supplies_batch IS
  'Gate 3 ACID: Atomically inserts new supplies and updates existing ones for an establishment.';
