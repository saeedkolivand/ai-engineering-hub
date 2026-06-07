import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsPage } from '../AnalyticsPage';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      tokens: [{ period: 'daily', usage: 100 }],
      savings: [{ provider: 'Claude', saved_tokens: 20 }],
      productivity: [{ metric: 'first_pass_success', value: 0.95 }],
    }),
  })
) as jest.Mock;

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

test('renders analytics tabs and tables', async () => {
  renderWithClient(<AnalyticsPage />);

  // Wait for loading to finish
  await waitFor(() => expect(screen.queryByText(/Loading analytics/i)).not.toBeInTheDocument());

  // Verify tab headers
  expect(screen.getByRole('tab', { name: /Tokens/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Savings/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Productivity/i })).toBeInTheDocument();

  // Verify one row in each table
  expect(screen.getByText('daily')).toBeInTheDocument();
  expect(screen.getByText('Claude')).toBeInTheDocument();
  expect(screen.getByText('first_pass_success')).toBeInTheDocument();
});