import React from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Card } from 'shared-ui';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Settings {
  theme: 'light' | 'dark';
  apiEndpoint: string;
  enableTelemetry: boolean;
}

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: current } = useForm<Settings>({
    defaultValues: async () => ({
      theme: 'light',
      apiEndpoint: '',
      enableTelemetry: false,
    }),
  }).useQuery({
    queryKey: ['settings'],
      queryFn: async () => {
        const res = await invoke('list_settings');
        return res;
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
    defaultValues: async () => current ?? { theme: 'light', apiEndpoint: '', enableTelemetry: false },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <Card title="Settings">
      <form.Provider onSubmit={form.handleSubmit}>
        <div className="space-y-4">
          <form.Field name="theme">
            {(field) => (
              <div>
                <label className="block font-medium">Theme</label>
                <select {...field.props} className="border rounded p-1 w-full">
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
                  {...field.props}
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
                <input type="checkbox" {...field.props} className="mr-2" />
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
      </form.Provider>
    </Card>
  );
};