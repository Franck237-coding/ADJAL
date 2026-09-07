import { spawn } from 'node:child_process';
import process from 'node:process';

const previewHost = '127.0.0.1';
const previewPort = 8082;
const previewUrl = `http://${previewHost}:${previewPort}`;
const projectRoot = new URL('..', import.meta.url);

let expoProcess;
let stopping = false;

function stopPreview() {
  if (expoProcess && !expoProcess.killed) {
    stopping = true;
    expoProcess.kill('SIGTERM');
  }
}

async function waitForPreview() {
  const deadline = Date.now() + 120_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(previewUrl, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Expo Web preview did not become ready at ${previewUrl}: ${lastError?.message ?? 'timeout'}`,
  );
}

function runCriticalFlows() {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('pnpm', ['run', 'test:critical-flows'], {
      cwd: projectRoot,
      env: { ...process.env, ADJAL_BASE_URL: previewUrl },
      stdio: 'inherit',
    });

    testProcess.once('error', reject);
    testProcess.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Critical mobile flows stopped by ${signal}`));
      } else if (code !== 0) {
        reject(new Error(`Critical mobile flows failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  console.log(`Starting deterministic Expo Web preview at ${previewUrl}...`);
  expoProcess = spawn(
    'pnpm',
    ['exec', 'expo', 'start', '--web', '--localhost', '--port', String(previewPort)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        BROWSER: 'none',
        // Metro serves the browser preview directly, so it has no /api proxy.
        // Point the deterministic smoke test at the workspace API unless the
        // caller explicitly provides another backend (the standalone README
        // uses the Spring API on port 8099).
        EXPO_PUBLIC_API_URL:
          process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8080/api',
      },
      stdio: 'inherit',
    },
  );

  expoProcess.once('error', (error) => {
    if (!stopping) throw error;
  });
  expoProcess.once('exit', (code, signal) => {
    if (!stopping && code !== 0) {
      console.error(
        `Expo Web preview exited before validation (${signal ?? `code ${code}`}).`,
      );
    }
  });

  try {
    await waitForPreview();
    console.log(`Expo Web preview ready; running flows at ${previewUrl}.`);
    await runCriticalFlows();
    console.log(
      'Critical mobile flows and JavaScript console checks passed at 375px, 390px, and 412px.',
    );
  } finally {
    stopPreview();
  }
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    stopPreview();
    process.exit(1);
  });
}

try {
  await main();
} catch (error) {
  stopPreview();
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}