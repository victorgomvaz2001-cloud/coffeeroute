import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { usePalette } from '@/hooks/use-palette';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const containers: Record<Variant, string> = {
  primary: 'bg-roast-500 dark:bg-roast-300',
  secondary: 'border border-crema-200 bg-white dark:border-night-800 dark:bg-night-900',
  ghost: 'bg-transparent',
  danger: 'border border-cherry-600 dark:border-cherry-300',
};

const labels: Record<Variant, string> = {
  primary: 'text-white dark:text-espresso-900',
  secondary: 'text-espresso-900 dark:text-crema-100',
  ghost: 'text-roast-600 dark:text-roast-300',
  danger: 'text-cherry-600 dark:text-cherry-300',
};

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

export function Button({ label, variant = 'primary', loading, disabled, className = '', ...props }: ButtonProps) {
  const palette = usePalette();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`min-h-12 flex-row items-center justify-center rounded-2xl px-5 active:opacity-80 ${containers[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? palette.onAccent : palette.accent} />
      ) : (
        <Text className={`text-base font-semibold ${labels[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
