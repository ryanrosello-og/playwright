/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { TestCaseView } from './testCaseView';
import type { TestCase, TestResult } from './types';

test.use({ viewport: { width: 800, height: 600 } });

const result: TestResult = {
  retry: 0,
  startTime: new Date(0).toUTCString(),
  duration: 100,
  errors: [],
  steps: [{
    title: 'Outer step',
    startTime: new Date(100).toUTCString(),
    duration: 10,
    location: { file: 'test.spec.ts', line: 62, column: 0 },
    count: 1,
    steps: [{
      title: 'Inner step',
      startTime: new Date(200).toUTCString(),
      duration: 10,
      location: { file: 'test.spec.ts', line: 82, column: 0 },
      steps: [],
      count: 1,
    }],
  }],
  attachments: [],
  status: 'passed',
};

const testCase: TestCase = {
  testId: 'testid',
  title: 'My test',
  path: [],
  projectName: 'chromium',
  location: { file: 'test.spec.ts', line: 42, column: 0 },
  annotations: [
    { type: 'annotation', description: 'Annotation text' },
    { type: 'annotation', description: 'Another annotation text' },
    { type: '_annotation', description: 'Hidden annotation' },
  ],
  tags: [],
  outcome: 'expected',
  duration: 10,
  ok: true,
  results: [result]
};

test('should render test case', async ({ mount }) => {
  const component = await mount(<TestCaseView projectNames={['chromium', 'webkit']} test={testCase} run={0} anchor=''></TestCaseView>);
  await expect(component.getByText('Annotation text', { exact: false }).first()).toBeVisible();
  await expect(component.getByText('Hidden annotation')).toBeHidden();
  await component.getByText('Annotations').click();
  await expect(component.getByText('Annotation text')).not.toBeVisible();
  await expect(component.getByText('Outer step')).toBeVisible();
  await expect(component.getByText('Inner step')).not.toBeVisible();
  await component.getByText('Outer step').click();
  await expect(component.getByText('Inner step')).toBeVisible();
  await expect(component.getByText('test.spec.ts:42')).toBeVisible();
  await expect(component.getByText('My test')).toBeVisible();
});

test('should correctly set the page title and favicon', async ({ mount, page }) => {
  await mount(<TestCaseView projectNames={['chromium', 'webkit']} test={testCase} run={0} anchor=''></TestCaseView>);
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toMatch(/\/assets\/logo_expected-[A-Za-z0-9]+\.svg/);
  expect(await page.title()).toEqual(`| ${testCase.title}`);
});

test('should fallback to default title and favicon', async ({ mount, page }) => {
  await mount(<TestCaseView projectNames={['chromium', 'webkit']} test={undefined} run={0} anchor=''></TestCaseView>);
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toMatch(/\/assets\/logo_default-[A-Za-z0-9]+\.svg/);
  expect(await page.title()).toEqual('Playwright Test Report | Summary');
});

const linkRenderingTestCase: TestCase = {
  testId: 'testid',
  title: 'My test',
  path: [],
  projectName: 'chromium',
  location: { file: 'test.spec.ts', line: 42, column: 0 },
  annotations: [
    { type: 'more info', description: 'read https://playwright.dev/docs/intro and https://playwright.dev/docs/api/class-playwright' },
    { type: 'related issues', description: 'https://github.com/microsoft/playwright/issues/23180, https://github.com/microsoft/playwright/issues/23181' },

  ],
  tags: [],
  outcome: 'expected',
  duration: 10,
  ok: true,
  results: [result]
};

test('should correctly render links in annotations', async ({ mount }) => {
  const component = await mount(<TestCaseView projectNames={['chromium', 'webkit']} test={linkRenderingTestCase} run={0} anchor=''></TestCaseView>);
  // const container = await(component.getByText('Annotations'));

  const firstLink = await component.getByText('https://playwright.dev/docs/intro').first();
  await expect(firstLink).toBeVisible();
  await expect(firstLink).toHaveAttribute('href', 'https://playwright.dev/docs/intro');

  const secondLink = await component.getByText('https://playwright.dev/docs/api/class-playwright').first();
  await expect(secondLink).toBeVisible();
  await expect(secondLink).toHaveAttribute('href', 'https://playwright.dev/docs/api/class-playwright');

  const thirdLink = await component.getByText('https://github.com/microsoft/playwright/issues/23180').first();
  await expect(thirdLink).toBeVisible();
  await expect(thirdLink).toHaveAttribute('href', 'https://github.com/microsoft/playwright/issues/23180');

  const fourthLink = await component.getByText('https://github.com/microsoft/playwright/issues/23181').first();
  await expect(fourthLink).toBeVisible();
  await expect(fourthLink).toHaveAttribute('href', 'https://github.com/microsoft/playwright/issues/23181');
});