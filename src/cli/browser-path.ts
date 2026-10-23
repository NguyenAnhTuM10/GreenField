import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from 'playwright-core';

// Share the same browser between text measurement and Remotion rendering.
export function resolveBrowserExecutable(explicitPath = process.env.CHROME_PATH): string {
 if(explicitPath){
  if(!existsSync(explicitPath))throw new Error(`CHROME_PATH does not exist: ${explicitPath}`);
  return explicitPath;
 }
 const candidates = process.platform === 'win32'
  ? [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]
    .filter((root): root is string => Boolean(root))
    .flatMap(root => [join(root,'Google','Chrome','Application','chrome.exe'),join(root,'Microsoft','Edge','Application','msedge.exe')])
  : ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
 candidates.push(chromium.executablePath());
 const executable = candidates.find(path => existsSync(path));
 if(!executable)throw new Error('No browser found. Set CHROME_PATH to your Chrome executable, or install Chromium with: npx playwright-core install chromium');
 return executable;
}
