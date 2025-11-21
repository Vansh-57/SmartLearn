SELECT * FROM users
WHERE is_donor
  AND blood_type = 'A+'  -- Example filter
  AND city = 'New York'  -- Example filter
  AND (
      last_donation_date IS NULL  -- Uses idx_donors_never_donated
      OR 
      (last_donation_date IS NOT NULL AND last_donation_date < CURRENT_DATE - 90)  -- Filters in memory after idx_donors_repeat_eligible narrows candidates
  );