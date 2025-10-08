#!/bin/bash

# Script to update Next.js 15 route params to Promise format
# Finds all route files with params and updates them

echo "Updating route params to Next.js 15 format (Promise)..."

# Find all route.ts files in app/api with dynamic segments
find app/api -type f -name "route.ts" -path "*/\[*\]/*" | while read file; do
  echo "Processing: $file"
  
  # Replace synchronous params with Promise params
  sed -i 's/{ params }: { params: { \([a-zA-Z]*\): string } }/{ params }: { params: Promise<{ \1: string }> }/g' "$file"
  
  # If the file was modified, add await params at the beginning of the function
  # This part would need manual review for each file
done

echo "Done! Please review the changes and add 'await params' where needed."
