# 🔧 EJECUTAR MIGRACIÓN DE SUSCRIPCIONES EN SUPABASE

## ⚠️ PROBLEMA ACTUAL

Tu aplicación está intentando acceder a columnas que no existen en la base de datos:
- `trial_end_date`
- `subscription_status`
- `plan_type`
- `stripe_customer_id`
- `stripe_subscription_id`
- `current_period_end`

Esto causa errores 500 en Supabase y el login no funciona.

## ✅ SOLUCIÓN: Ejecutar la Migración SQL

### Paso 1: Ir al SQL Editor de Supabase

Abre este link en tu navegador:
```
https://app.supabase.com/project/bwhqivcdvvqrqawbhnof/sql/new
```

### Paso 2: Copiar y Pegar el SQL

Copia TODO el contenido del archivo:
```
supabase/migrations/add_subscription_fields.sql
```

O copia directamente este SQL:

```sql
-- Migration: Add subscription and trial fields to establishments table
-- Description: Adds fields for managing subscriptions, trials, and Stripe integration

-- Add subscription-related columns to establishments table
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free_trial',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_establishments_user_id ON establishments(user_id);
CREATE INDEX IF NOT EXISTS idx_establishments_stripe_customer_id ON establishments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_establishments_subscription_status ON establishments(subscription_status);

-- Add comment to columns
COMMENT ON COLUMN establishments.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN establishments.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN establishments.subscription_status IS 'Status: trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired';
COMMENT ON COLUMN establishments.plan_type IS 'Plan type: free_trial, monthly, yearly, expired';
COMMENT ON COLUMN establishments.trial_end_date IS 'Date when the free trial ends (30 days from signup)';
COMMENT ON COLUMN establishments.current_period_end IS 'Current billing period end date';

-- Function to check if trial has expired
CREATE OR REPLACE FUNCTION is_trial_expired(establishment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_end TIMESTAMPTZ;
  sub_status TEXT;
BEGIN
  SELECT trial_end_date, subscription_status
  INTO trial_end, sub_status
  FROM establishments
  WHERE id = establishment_id;
  
  -- If has active subscription, trial status doesn't matter
  IF sub_status IN ('active', 'trialing') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if trial has expired
  IF trial_end IS NOT NULL AND trial_end < NOW() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update subscription status when trial expires
CREATE OR REPLACE FUNCTION update_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE establishments
  SET 
    subscription_status = 'expired',
    plan_type = 'expired'
  WHERE 
    trial_end_date < NOW()
    AND subscription_status = 'trialing'
    AND stripe_subscription_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_trial_expired TO authenticated;
GRANT EXECUTE ON FUNCTION update_expired_trials TO authenticated;
```

### Paso 3: Ejecutar el SQL

1. Pega el SQL en el editor
2. Haz clic en el botón **"Run"** (esquina inferior derecha)
3. Espera a que aparezca "Success" ✅

### Paso 4: Verificar que Funcionó

Ejecuta esta query para verificar que las columnas se crearon:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'establishments' 
AND column_name IN (
  'trial_end_date',
  'subscription_status',
  'plan_type',
  'stripe_customer_id',
  'stripe_subscription_id',
  'current_period_end'
);
```

Deberías ver 6 filas en el resultado.

### Paso 5: Probar el Login

Una vez ejecutada la migración:
1. Vuelve a http://localhost:3000/auth/login
2. Intenta iniciar sesión
3. ¡Debería funcionar! ✅

---

## 🆘 Si Hay Errores

Si al ejecutar el SQL aparece algún error, cópialo y compártelo conmigo para ayudarte a resolverlo.

## 📝 Nota Importante

Esta migración es **segura** porque:
- Usa `IF NOT EXISTS` - no romperá nada si ya existe
- Solo agrega columnas nuevas
- No modifica ni elimina datos existentes
- Tiene valores por defecto para registros existentes
