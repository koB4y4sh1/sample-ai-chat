import { HttpAgent } from '@ag-ui/client';

const agUiBaseUrl = process.env.AG_UI_BASE_URL ?? 'http://127.0.0.1:8100';

export const agents = {
  zenith: new HttpAgent({
    url: new URL('/copilotkit', agUiBaseUrl).toString(),
  }),
};
