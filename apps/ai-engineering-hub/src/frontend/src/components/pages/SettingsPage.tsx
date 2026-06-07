import React from 'react';
import { Card } from 'shared-ui';

export const SettingsPage: React.FC = () => {
  return (
    <Card title="Settings">
      <p className="text-sm text-gray-600">
        Settings UI will be built here. Include preferences, API keys, and
        integration toggles.
      </p>
    </Card>
  );
};