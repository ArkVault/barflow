-- Gate 3: Transactional reservation + layout update for OpenTable webhooks
-- Ensures that reservation row changes and operations_layout table status
-- are always consistent (both succeed or both fail).

-- ============================================================
-- 1. Create reservation + update table status in layout
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_reservation_with_layout(
  p_establishment_id UUID,
  p_table_id TEXT,
  p_external_id TEXT,
  p_source TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_party_size INT DEFAULT 1,
  p_reservation_date DATE DEFAULT CURRENT_DATE,
  p_reservation_time TIME DEFAULT CURRENT_TIME,
  p_notes TEXT DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  p_layout_status TEXT DEFAULT 'reservada',
  p_layout_reservation JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_layout_sections JSONB;
BEGIN
  -- Insert reservation
  INSERT INTO reservations (
    establishment_id, table_id, external_id, source,
    customer_name, customer_phone, customer_email,
    party_size, reservation_date, reservation_time,
    status, notes, special_requests
  ) VALUES (
    p_establishment_id, p_table_id, p_external_id, p_source,
    p_customer_name, p_customer_phone, p_customer_email,
    p_party_size, p_reservation_date, p_reservation_time,
    'confirmed', p_notes, p_special_requests
  );

  -- Update operations_layout table status
  SELECT sections INTO v_layout_sections
  FROM operations_layout
  WHERE establishment_id = p_establishment_id;

  IF v_layout_sections IS NOT NULL THEN
    -- Update the matching table's status and reservation in the JSONB sections
    UPDATE operations_layout
    SET sections = (
      SELECT jsonb_agg(
        jsonb_set(
          jsonb_set(
            section,
            '{tables}',
            (
              SELECT jsonb_agg(
                CASE
                  WHEN tbl->>'id' = p_table_id THEN
                    tbl
                    || jsonb_build_object('status', p_layout_status)
                    || jsonb_build_object('reservation', COALESCE(p_layout_reservation, 'null'::JSONB))
                  ELSE tbl
                END
              )
              FROM jsonb_array_elements(section->'tables') AS tbl
            )
          ),
          '{bars}',
          section->'bars'
        )
      )
      FROM jsonb_array_elements(v_layout_sections) AS section
    )
    WHERE establishment_id = p_establishment_id;
  END IF;
END;
$$;

-- ============================================================
-- 2. Update reservation status + update table status in layout
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_reservation_status_with_layout(
  p_external_id TEXT,
  p_new_status TEXT,
  p_layout_status TEXT DEFAULT NULL,
  p_layout_reservation JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_establishment_id UUID;
  v_table_id TEXT;
  v_layout_sections JSONB;
BEGIN
  -- Update reservation and capture the row
  UPDATE reservations
  SET status = p_new_status
  WHERE external_id = p_external_id
  RETURNING establishment_id, table_id
  INTO v_establishment_id, v_table_id;

  -- If layout update requested and reservation was found
  IF p_layout_status IS NOT NULL AND v_establishment_id IS NOT NULL THEN
    SELECT sections INTO v_layout_sections
    FROM operations_layout
    WHERE establishment_id = v_establishment_id;

    IF v_layout_sections IS NOT NULL THEN
      UPDATE operations_layout
      SET sections = (
        SELECT jsonb_agg(
          jsonb_set(
            jsonb_set(
              section,
              '{tables}',
              (
                SELECT jsonb_agg(
                  CASE
                    WHEN tbl->>'id' = v_table_id THEN
                      tbl
                      || jsonb_build_object('status', p_layout_status)
                      || jsonb_build_object('reservation', COALESCE(p_layout_reservation, 'null'::JSONB))
                    ELSE tbl
                  END
                )
                FROM jsonb_array_elements(section->'tables') AS tbl
              )
            ),
            '{bars}',
            section->'bars'
          )
        )
        FROM jsonb_array_elements(v_layout_sections) AS section
      )
      WHERE establishment_id = v_establishment_id;
    END IF;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.create_reservation_with_layout IS
  'Gate 3 ACID: Atomically creates a reservation and updates the table status in operations_layout.';

COMMENT ON FUNCTION public.update_reservation_status_with_layout IS
  'Gate 3 ACID: Atomically updates a reservation status and the corresponding table status in operations_layout.';
