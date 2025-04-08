#!/bin/sh

# Wait for DB to be ready
echo "⏳ Waiting for the database to wake up..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ Database is live!"

# Run Prisma stuff
npx prisma generate
npx prisma migrate deploy

# Run the app
npm run start:prod