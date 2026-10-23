import {afterEach,describe,expect,it,vi} from 'vitest';
import {existsSync} from 'node:fs';
import {resolveBrowserExecutable} from '../src/cli/browser-path';

vi.mock('node:fs',()=>({existsSync:vi.fn()}));
vi.mock('playwright-core',()=>({chromium:{executablePath:()=>'/test/chromium'}}));

afterEach(()=>{vi.resetAllMocks();vi.unstubAllEnvs();});

describe('browser executable resolution',()=>{
 it('honors CHROME_PATH before automatic detection',()=>{
  vi.stubEnv('CHROME_PATH','/custom/chrome');
  vi.mocked(existsSync).mockReturnValue(true);
  expect(resolveBrowserExecutable()).toBe('/custom/chrome');
  expect(existsSync).toHaveBeenCalledExactlyOnceWith('/custom/chrome');
 });
 it('reports an invalid explicit path',()=>{
  vi.mocked(existsSync).mockReturnValue(false);
  expect(()=>resolveBrowserExecutable('/missing/chrome')).toThrow('CHROME_PATH does not exist');
 });
 it('uses installed Playwright Chromium when system browsers are absent',()=>{
  vi.stubEnv('CHROME_PATH','');
  vi.mocked(existsSync).mockImplementation(path=>path==='/test/chromium');
  expect(resolveBrowserExecutable()).toBe('/test/chromium');
 });
 it('explains how to install a browser when none is available',()=>{
  vi.stubEnv('CHROME_PATH','');
  vi.mocked(existsSync).mockReturnValue(false);
  expect(()=>resolveBrowserExecutable()).toThrow('npx playwright-core install chromium');
 });
});
