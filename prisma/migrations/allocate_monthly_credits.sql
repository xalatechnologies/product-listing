-- Monthly Credit Allocation Function
-- This function allocates monthly subscription credits to all active subscriptions
-- Can be scheduled with pg_cron or called manually

CREATE OR REPLACE FUNCTION allocate_monthly_subscription_credits()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  subscription_record RECORD;
  credit_amount INTEGER;
BEGIN
  -- Loop through all active subscriptions
  FOR subscription_record IN
    SELECT 
      s.id,
      s."userId",
      s.plan,
      s."currentPeriodStart",
      s."currentPeriodEnd"
    FROM "Subscription" s
    WHERE s.status IN ('ACTIVE', 'TRIALING')
  LOOP
    -- Check if current period just started (within last 24 hours)
    IF subscription_record."currentPeriodStart" > NOW() - INTERVAL '24 hours' THEN
      -- Determine credit amount based on plan
      CASE subscription_record.plan
        WHEN 'STARTER' THEN
          credit_amount := 10;
        WHEN 'PROFESSIONAL' THEN
          credit_amount := 50;
        WHEN 'AGENCY' THEN
          credit_amount := 999999; -- Unlimited
        ELSE
          credit_amount := 0;
      END CASE;

      -- Only add credits if amount > 0
      IF credit_amount > 0 THEN
        -- Create credit transaction
        INSERT INTO "CreditTransaction" (
          id,
          "userId",
          amount,
          type,
          description,
          metadata,
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          subscription_record."userId",
          credit_amount,
          'SUBSCRIPTION',
          'Monthly subscription credits for ' || subscription_record.plan || ' plan',
          jsonb_build_object(
            'subscriptionId', subscription_record.id,
            'periodStart', subscription_record."currentPeriodStart",
            'periodEnd', subscription_record."currentPeriodEnd"
          ),
          NOW(),
          NOW()
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Example: Schedule with pg_cron (if available)
-- SELECT cron.schedule('allocate-monthly-credits', '0 0 1 * *', 'SELECT allocate_monthly_subscription_credits();');

-- To run manually:
-- SELECT allocate_monthly_subscription_credits();

