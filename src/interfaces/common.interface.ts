export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'urgent' | (string & {});

export interface SelectFilterConfig {
  value: any;
  onChange: (value: any) => void;
  options: { value: any; label: string }[];
  placeholder?: string;
  width?: number | string;
}
