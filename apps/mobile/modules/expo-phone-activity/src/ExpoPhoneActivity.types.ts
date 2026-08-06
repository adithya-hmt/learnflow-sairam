export type AppUsage = {
  packageName: string;
  name: string;
  minutes: number;
  lastUsedAt: number;
};

export type PhoneUsage = {
  permissionGranted: boolean;
  totalMinutes: number;
  apps: AppUsage[];
  generatedAt?: number;
};
