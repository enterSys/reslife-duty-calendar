-- Grant admin role to mahzeyarmaroufi@gmail.com
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'mahzeyarmaroufi@gmail.com';

-- Verify the update
SELECT id, email, "fullName", role, "createdAt" 
FROM "User" 
WHERE email = 'mahzeyarmaroufi@gmail.com';