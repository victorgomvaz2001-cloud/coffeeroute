import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { usePalette } from '@/hooks/use-palette';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, ...props },
  ref,
) {
  const palette = usePalette();
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-espresso-700 dark:text-crema-200">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={palette.muted}
        className={`min-h-12 rounded-xl border bg-white px-4 text-base text-espresso-900 dark:bg-night-900 dark:text-crema-100 ${
          error
            ? 'border-cherry-600 dark:border-cherry-300'
            : 'border-crema-200 dark:border-night-800'
        }`}
        {...props}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-cherry-600 dark:text-cherry-300">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-sm text-espresso-500 dark:text-crema-200">{hint}</Text>
      ) : null}
    </View>
  );
});
