import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const executablePath = browser.executablePath();
  await browser.close();
  console.log('Chromium path:', executablePath);
  
  // start server
  const server = spawn('npm', ['run', 'start:public'], { stdio: 'ignore', shell: true });
  console.log('Waiting for server...');
  await new Promise(r => setTimeout(r, 8000));
  
  try {
    console.log('Running Lighthouse...');
    const { stdout, stderr } = await execAsync(`npx lighthouse http://localhost:3000 --output json --output-path ./lh-test.json --only-categories=performance --chrome-flags="--headless" --preset=mobile`, {
      env: { ...process.env, CHROME_PATH: executablePath }
    });
    console.log('Lighthouse done.', stdout, stderr);
  } catch (e) {
    console.log('Lighthouse failed', e);
  }
  
  server.kill();
  process.exit(0);
}
run();
