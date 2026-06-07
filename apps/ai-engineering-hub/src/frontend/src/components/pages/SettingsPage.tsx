import React, { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card } from 'shared-ui';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface Settings {
  theme: 'light' | 'dark';
  apiEndpoint: string;
  enableTelemetry: boolean;
}

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: current, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await invoke('list_settings');
      return res as Settings;
    },
  });

  const mutation = useMutation({
      mutationFn: async (values: Settings) => {
        const res = await invoke('update_settings', { settings: values });
        return res;
      },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const form = useForm<Settings>({
    defaultValues: current ?? { theme: 'light', apiEndpoint: '', enableTelemetry: false },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    if (current) {
      form.reset(current);
    }
  }, [current, form]);

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <Card title="Settings">
      <form onSubmit={form.handleSubmit}>
        <div className="space-y-4">
          <form.Field name="theme">
            {(field) => (
              <div>
                <label className="block font-medium">Theme</label>
                <select
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value as 'light' | 'dark')}
                  className="border rounded p-1 w-full"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            )}
          </form.Field>

          <form.Field name="apiEndpoint">
            {(field) => (
              <div>
                <label className="block font-medium">API Endpoint</label>
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="url"
                  placeholder="http://localhost:3000"
                  className="border rounded p-1 w-full"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="enableTelemetry">
            {(field) => (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="mr-2"
                />
                <label className="font-medium">Enable Telemetry (optional)</label>
              </div>
            )}
          </form.Field>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {mutation.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </Card>
  );
};