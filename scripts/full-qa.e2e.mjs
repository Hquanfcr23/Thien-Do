import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import process from 'node:process';
import { Buffer } from 'node:buffer';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const state = () => page.evaluate(async () => (await import('/src/state/gameStore.ts')).useGameStore.getState().game);
const labelOverlaps = () => page.locator('[data-testid="map-label"]').evaluateAll(elements => {
  const rectangles = elements.map(element => element.getBoundingClientRect());
  let count = 0;
  for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) {
    const a = rectangles[i], b = rectangles[j];
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 8 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 8) count++;
  }
  return count;
});
try {
  await page.goto(process.env.MAP_TEST_URL ?? 'http://127.0.0.1:5173/');
  await page.getByRole('button', { name: 'Khởi lập triều đại', exact: true }).click();
  await page.getByRole('button', { name: 'Nhận thiên mệnh' }).click();
  await expect(page.getByRole('region', { name: 'Bản đồ hành chính Đại Ninh' })).toBeVisible();
  const layer = page.getByRole('group', { name: 'Chế độ bản đồ' });
  for (const [name, level, count] of [['Châu', 'zhou', 3], ['Phủ', 'fu', 7], ['Huyện', 'xian', 24]]) {
    await layer.getByRole('button', { name, exact: true }).click();
    expect(await page.locator('.territories [data-unit-id]').count()).toBe(count);
    expect((await state()).mapView.level).toBe(level);
    expect(await labelOverlaps()).toBe(0);
  }
  await layer.getByRole('button', { name: 'Phủ', exact: true }).click();
  await page.getByRole('button', { name: 'Kinh tế', exact: true }).click();
  const target = page.getByTestId('territory-zhou-trung-ninh-fu-1');
  await target.focus();
  await page.keyboard.press('Enter');
  expect((await state()).mapView.selectedId).toBe('zhou-trung-ninh-fu-1');
  await expect(page.getByRole('heading', { name: 'Kinh tế', exact: true })).toBeVisible();
  await expect(layer.getByRole('button', { name: 'Phủ', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const camera = page.getByTestId('map-camera');
  const initialCamera = await camera.getAttribute('transform');
  await page.getByRole('button', { name: 'Phóng to bản đồ' }).click();
  expect(await camera.getAttribute('transform')).not.toBe(initialCamera);
  await page.getByRole('button', { name: 'Reset View' }).click();
  await page.getByRole('button', { name: 'Đóng bảng quản lý' }).click();
  const beforePan = await camera.getAttribute('transform');
  await page.mouse.move(850, 420);
  await page.mouse.down();
  await page.mouse.move(960, 500, { steps: 12 });
  await page.mouse.up();
  expect(await camera.getAttribute('transform')).not.toBe(beforePan);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'Reset View' }).click();
  expect(await camera.getAttribute('transform')).toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Toàn cảnh Trung Hoa' }).click();
  await page.screenshot({ path: 'docs/screenshots/full-qa-china.png', fullPage: true });
  await page.getByRole('button', { name: 'Kinh tế', exact: true }).click();
  for (const name of ['Tổng quan', 'Dân số', 'Sản xuất', 'Thị trường', 'Vận tải', 'Xây dựng', 'Thuế', 'Ngân sách & kho', 'Báo cáo']) {
    await page.getByRole('navigation', { name: 'Mục kinh tế' }).getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Mục kinh tế' }).getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByRole('navigation', { name: 'Mục kinh tế' }).getByRole('button', { name: 'Thuế' }).click();
  await page.getByRole('spinbutton', { name: 'Thuế đất' }).fill('18');
  await page.getByRole('button', { name: 'Xếp chính sách' }).click();
  expect((await state()).simulation.orders.length).toBe(1);
  const advance = page.getByRole('button', { name: 'Tiến 1 lượt' });
  await advance.click();
  await expect(page.locator('.imperial-date')).toContainText('Giữa tháng');
  expect((await state()).simulation.tick).toBe(0);
  expect((await state()).simulation.orders.length).toBe(1);
  await advance.click();
  await expect(page.locator('.imperial-date')).toContainText('Tháng 2');
  expect((await state()).simulation.tick).toBe(1);
  expect((await state()).simulation.orders.length).toBe(0);
  expect((await state()).simulation.zhouPolicies['zhou-trung-ninh'].landTax).toBe(.18);
  await page.getByRole('combobox', { name: 'Phạm vi kinh tế' }).selectOption('zhou-trung-ninh-fu-1-jun-1-xian-1');
  await page.getByRole('navigation', { name: 'Mục kinh tế' }).getByRole('button', { name: 'Xây dựng' }).click();
  await page.locator('.construction-card').filter({ has: page.getByRole('heading', { name: 'Khai khẩn ruộng' }) }).locator('.construction-upgrade').click();
  expect((await state()).simulation.orders.some(order => order.kind === 'build')).toBe(true);
  await page.locator('.command-rail').getByRole('button', { name: 'Xây dựng' }).click();
  await expect(page.locator('.construction-status.queued')).toBeVisible();
  await page.getByRole('button', { name: 'Kinh tế', exact: true }).click();
  await page.getByRole('navigation', { name: 'Mục kinh tế' }).getByRole('button', { name: 'Ngân sách & kho' }).click();
  await page.getByRole('spinbutton', { name: 'Số lượng điều phối' }).fill('100');
  await page.getByRole('button', { name: 'Điều bạc ngân sách' }).click();
  expect((await state()).simulation.orders.some(order => order.kind === 'budget-transfer')).toBe(true);
  await advance.click();
  expect((await state()).simulation.tick).toBe(1);
  await advance.click();
  expect((await state()).simulation.tick).toBe(2);
  expect((await state()).simulation.orders.length).toBe(0);
  expect((await state()).simulation.counties['zhou-trung-ninh-fu-1-jun-1-xian-1'].projects.length).toBeGreaterThan(0);
  await page.screenshot({ path: 'docs/screenshots/full-qa-economy.png', fullPage: true });
  await page.getByRole('button', { name: 'Thư khố', exact: true }).click();
  await page.getByRole('combobox', { name: 'Ô lưu' }).selectOption('manual-2');
  await page.getByRole('button', { name: 'Lưu hồ sơ', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đã lưu hồ sơ.');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất JSON' }).click();
  const downloaded = await downloadEvent;
  const saved = JSON.parse(await fs.readFile(await downloaded.path(), 'utf8'));
  expect(saved.state.simulation.tick).toBe(2);
  expect(saved.state.decisionTurn).toBe('early');
  await page.locator('input[type=file]').setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.reload();
  await page.getByRole('button', { name: 'Tiếp tục trị vì' }).click();
  expect((await state()).simulation.tick).toBe(2);
  expect((await state()).simulation.zhouPolicies['zhou-trung-ninh'].landTax).toBe(.18);
  expect(errors).toEqual([]);
  process.stdout.write('Full QA browser: map levels/selection/camera, all economy tabs, policy/build/budget orders, 24-turn calendar, save/export/import/reload passed\n');
} finally {
  await browser.close();
}
