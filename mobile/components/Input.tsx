import { TextInput, View, Text, StyleSheet, useColorScheme, TextInputProps } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '@/lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            color: theme.foreground,
            borderColor: error ? theme.destructive : theme.border,
          },
          style,
        ]}
        placeholderTextColor={theme.mutedForeground}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.base,
  },
  error: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
