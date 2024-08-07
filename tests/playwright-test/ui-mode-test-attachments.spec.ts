/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test, expect, retries } from './ui-mode-fixtures';

test.describe.configure({ mode: 'parallel', retries });

test('should contain text attachment', async ({ runUITest }) => {
  const { page } = await runUITest({
    'a.test.ts': `
      import { test } from '@playwright/test';
      test('attach test', async () => {
        await test.info().attach('note', { path: __filename });
        await test.info().attach('🎭', { body: 'hi tester!', contentType: 'text/plain' });
        await test.info().attach('escaped', { body: '## Header\\n\\n> TODO: some todo\\n- _Foo_\\n- **Bar**', contentType: 'text/plain' });
      });
    `,
  });
  await page.getByText('attach test').click();
  await page.getByTitle('Run all').click();
  await expect(page.getByTestId('status-line')).toHaveText('1/1 passed (100%)');
  await page.getByText('Attachments').click();
  for (const { name, content, displayedAsText } of [
    { name: 'note', content: 'attach test', displayedAsText: false },
    { name: '🎭', content: 'hi tester!', displayedAsText: true },
    { name: 'escaped', content: '## Header\n\n> TODO: some todo\n- _Foo_\n- **Bar**', displayedAsText: true },
  ]) {
    await page.getByText(`attach "${name}"`, { exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.expandable-title', { hasText: name }).click();
    await expect(page.getByLabel(name)).toContainText(displayedAsText ?
      content.split('\n')?.[0] :
      'no preview available'
    );
    await page.locator('.expandable-title', { hasText: name }).getByRole('link').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(name);
    expect((await readAllFromStream(await download.createReadStream())).toString()).toContain(content);
  }
});

test('should contain binary attachment', async ({ runUITest }) => {
  const { page } = await runUITest({
    'a.test.ts': `
      import { test } from '@playwright/test';
      test('attach test', async () => {
        await test.info().attach('data', { body: Buffer.from([1, 2, 3]), contentType: 'application/octet-stream' });
      });
    `,
  });
  await page.getByText('attach test').click();
  await page.getByTitle('Run all').click();
  await expect(page.getByTestId('status-line')).toHaveText('1/1 passed (100%)');
  await page.getByText('Attachments').click();
  await page.getByText('attach "data"', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.expandable-title', { hasText: 'data' }).getByRole('link').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('data');
  expect(await readAllFromStream(await download.createReadStream())).toEqual(Buffer.from([1, 2, 3]));
});

test('should contain string attachment', async ({ runUITest }) => {
  const { page } = await runUITest({
    'a.test.ts': `
      import { test } from '@playwright/test';
      test('attach test', async () => {
        await test.info().attach('note', { body: 'text42' });
      });
    `,
  });
  await page.getByText('attach test').click();
  await page.getByTitle('Run all').click();
  await expect(page.getByTestId('status-line')).toHaveText('1/1 passed (100%)');
  await page.getByText('Attachments').click();
  await page.getByText('attach "note"', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.expandable-title', { hasText: 'note' }).getByRole('link').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('note');
  expect((await readAllFromStream(await download.createReadStream())).toString()).toEqual('text42');
});

function readAllFromStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise(resolve => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
