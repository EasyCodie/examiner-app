import { spawn } from 'child_process';
import path from 'path';
import { CartesianGraphSpec } from './graphRenderer';

/**
 * Executes python scripts/render_graph.py headlessly in Node.js server environment.
 */
export async function renderGraphServer(spec: CartesianGraphSpec): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'render_graph.py');
    const pyProcess = spawn('python', [scriptPath, '--stdin']);

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python render_graph exited with code ${code}: ${stderrData}`));
      } else {
        resolve(stdoutData.trim());
      }
    });

    pyProcess.stdin.write(JSON.stringify(spec));
    pyProcess.stdin.end();
  });
}
