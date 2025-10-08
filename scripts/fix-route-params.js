const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all route.ts files with params
const files = execSync(
  'find app/api -name "route.ts" -type f -exec grep -l "params.*: {" {} \\;',
  { encoding: 'utf-8' }
)
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} route files to update\n`);

files.forEach((filePath) => {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Pattern 1: { params }: { params: { id: string } }
  if (content.includes('params: { id: string }')) {
    content = content.replace(
      /\{ params \}: \{ params: \{ id: string \} \}/g,
      '{ params }: { params: Promise<{ id: string }> }'
    );
    modified = true;
  }

  // Pattern 2: { params }: { params: { productId: string } }
  if (content.includes('params: { productId: string }')) {
    content = content.replace(
      /\{ params \}: \{ params: \{ productId: string \} \}/g,
      '{ params }: { params: Promise<{ productId: string }> }'
    );
    modified = true;
  }

  if (modified) {
    // Now we need to add await params at the start of each function
    // Find all functions with params and add const { id } = await params
    
    // Pattern for functions with id param
    content = content.replace(
      /(export async function \w+\([^)]*\{ params \}: \{ params: Promise<\{ id: string \}> \}[^)]*\)\s*\{)\s*/g,
      (match, funcStart) => {
        // Check if await params already exists in the next few lines
        const checkNext = content.substr(content.indexOf(match), 200);
        if (checkNext.includes('await params')) {
          return match;
        }
        return `${funcStart}\n  const { id } = await params\n  `;
      }
    );

    // Pattern for functions with productId param
    content = content.replace(
      /(export async function \w+\([^)]*\{ params \}: \{ params: Promise<\{ productId: string \}> \}[^)]*\)\s*\{)\s*/g,
      (match, funcStart) => {
        const checkNext = content.substr(content.indexOf(match), 200);
        if (checkNext.includes('await params')) {
          return match;
        }
        return `${funcStart}\n  const { productId } = await params\n  `;
      }
    );

    // Replace params.id with id
    content = content.replace(/params\.id/g, 'id');
    // Replace params.productId with productId  
    content = content.replace(/params\.productId/g, 'productId');

    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated ${filePath}\n`);
  } else {
    console.log(`  No changes needed\n`);
  }
});

console.log('Done!');
