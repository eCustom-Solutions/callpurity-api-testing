import { describe, it, expect } from 'vitest';
import CallPuritySDK from '../../client.js';

describe('Auth (integration)', () => {
  it('logs in and refreshes', async () => {
    const login = await CallPuritySDK.auth.login(
      process.env.EMAIL!,
      process.env.PASSWORD!
    );

    expect(login).toHaveProperty('access_token');

    const refreshed = await CallPuritySDK.auth.refresh(login.refresh_token);
    expect(refreshed.access_token).not.toBe(login.access_token);
  });
}); 