/*
  # Fix payment transactions RLS policy

  1. Security
    - Add INSERT policy for payment_transactions table
    - Allow authenticated users to create payment transactions for their own sessions
    - Ensure proper access control for payment data
*/

-- Add INSERT policy for payment_transactions
CREATE POLICY "Users can create payment transactions for their sessions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Also ensure UPDATE policy exists for payment status updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_transactions' 
    AND policyname = 'Users can update own payment transactions'
  ) THEN
    CREATE POLICY "Users can update own payment transactions"
      ON payment_transactions
      FOR UPDATE
      TO authenticated
      USING (client_id = auth.uid())
      WITH CHECK (client_id = auth.uid());
  END IF;
END $$;