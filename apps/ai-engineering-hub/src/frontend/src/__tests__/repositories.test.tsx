import React from 'react';
import { render, screen } from '@testing-library/react';
import { Repositories } from '../routes/Repositories';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('renders Repositories page header', async () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <Repositories />
    </QueryClientProvider>
  );

  const heading = await screen.findByText(/Repositories/i);
  expect(heading).toBeInTheDocument();
});