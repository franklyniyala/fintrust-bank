
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent
} from '@testing-library/react';
import { App } from '../main';

describe('FinTrust Banking Portal', () => {
  beforeEach(() => {
    // Mock backend responses so tests do not need a real API.
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/accounts')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              customer_name: 'Jane Customer',
              account_number: 'FT1001',
              balance: 15000
            }
          ])
        });
      }

      if (url.includes('/api/transactions')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            {
              id: 1,
              type: 'Deposit',
              customer_name: 'Jane Customer',
              description: 'Initial deposit',
              amount: 15000
            }
          ])
        });
      }

      if (url.includes('/health')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            status: 'OK',
            database: 'connected'
          })
        });
      }

      return Promise.reject(new Error(`Unexpected API URL: ${url}`));
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('displays the main banking portal sections', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /digital banking operations portal/i
      })
    ).toBeTruthy();

    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeTruthy();

    expect(
      screen.getByRole('heading', { name: /^accounts$/i })
    ).toBeTruthy();

    expect(
      screen.getByRole('heading', { name: /recent transactions/i })
    ).toBeTruthy();

    await waitFor(() => {
      expect(
        screen.getByText(/OK \| Database: connected/i)
      ).toBeTruthy();
    });
  });

  it('submits a new account with a sanitized customer name', async () => {
    render(<App />);

    const nameInput = screen.getByPlaceholderText('Customer name');

    fireEvent.change(nameInput, {
      target: { value: '  <Jane Customer>  ' }
    });

    fireEvent.click(
      screen.getByRole('button', { name: /create account/i })
    );

    await waitFor(() => {
      const accountRequest = global.fetch.mock.calls.find(
        ([url, options]) =>
          url.includes('/api/accounts') &&
          options?.method === 'POST'
      );

      expect(accountRequest).toBeTruthy();

      const requestBody = JSON.parse(accountRequest[1].body);

      expect(requestBody.customerName).toBe('Jane Customer');
      expect(requestBody.openingBalance).toBe(0);
    });
  });

    it('rejects an empty customer name', async () => {
      render(<App />);

      const nameInput = screen.getByPlaceholderText('Customer name');

  fireEvent.change(nameInput, {
    target: { value: '   ' }
  });

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByText('Customer name is invalid')).toBeTruthy();

  const accountCreationRequest = global.fetch.mock.calls.find(
    ([url, options]) =>
      url.includes('/api/accounts') &&
      options?.method === 'POST'
  );

  expect(accountCreationRequest).toBeUndefined();
});


  it('displays accounts and recent transactions returned by the API', async () => {
    render(<App />);

    expect(await screen.findByText('Jane Customer')).toBeTruthy();
    expect(await screen.findByText('FT1001')).toBeTruthy();

    expect(
      await screen.findByText(/Jane Customer\s*\|\s*Initial deposit/)
    ).toBeTruthy();

    expect(
      screen.getByRole('button', { name: /deposit/i })
    ).toBeTruthy();

    expect(
      screen.getByRole('button', { name: /withdraw/i })
    ).toBeTruthy();
  });
      it('submits a deposit for an account', async () => {
    render(<App />);

    // Wait until the account appears.
    expect(await screen.findByText('FT1001')).toBeTruthy();

    // Click the Deposit button.
    fireEvent.click(
      screen.getByRole('button', { name: /deposit/i })
    );

    // Verify the POST request.
    await waitFor(() => {
      const depositRequest = global.fetch.mock.calls.find(
        ([url, options]) =>
          url.includes('/api/accounts/123e4567-e89b-12d3-a456-426614174000/deposit') &&
          options?.method === 'POST'
      );

      expect(depositRequest).toBeTruthy();

      const requestBody = JSON.parse(depositRequest[1].body);

      expect(requestBody.amount).toBe(5000);
      expect(requestBody.description).toBe('Demo deposit from portal');
    });
  });

  it('submits a withdrawal for an account', async () => {
  render(<App />);

  expect(await screen.findByText('FT1001')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: /withdraw/i }));

  await waitFor(() => {
    const withdrawalRequest = global.fetch.mock.calls.find(
      ([url, options]) =>
        url.includes('/api/accounts/123e4567-e89b-12d3-a456-426614174000/withdraw') &&
        options?.method === 'POST'
    );

    expect(withdrawalRequest).toBeTruthy();

    const requestBody = JSON.parse(withdrawalRequest[1].body);

    expect(requestBody.amount).toBe(2500);
    expect(requestBody.description).toBe('Demo withdrawal from portal');
  });
});
});




