import { test, expect } from '@grafana/plugin-e2e';

// This is an end-to-end smoke test and requires a running Grafana instance.
test('World Explorer displays its demo observations and developer credit', async ({
  panelEditPage,
  page,
}) => {
  await panelEditPage.setVisualization('BloomAtlasWorld');
  await expect(page.getByTestId('observation-count')).toContainText('12 of 12');
  await expect(page.getByTestId('developer-credit')).toContainText('Tuğçe Topuz');
});
