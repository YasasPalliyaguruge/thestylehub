import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function deploy() {
  try {
    const tokenPath = join(process.cwd(), 'token.md');
    
    if (!existsSync(tokenPath)) {
      console.error('Error: token.md not found. A valid Vercel token is required for deployment.');
      process.exit(1);
    }
    
    const token = readFileSync(tokenPath, 'utf8').trim();
    
    if (!token) {
      console.error('Error: token.md is empty.');
      process.exit(1);
    }
    
    console.log('Starting production deployment to Vercel...');
    
    // Run Vercel deployment synchronously so we see the output live
    execSync(`npx vercel --prod --token ${token}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed. Check the error output above.');
    process.exit(1);
  }
}

deploy();
