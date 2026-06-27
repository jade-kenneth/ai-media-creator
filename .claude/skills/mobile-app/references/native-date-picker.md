# Native Date Picker

## Library

Use `@react-native-community/datetimepicker` for native date/time input. This renders the platform's built-in picker:
- **iOS**: Inline spinner or calendar wheel (modal on older iOS)
- **Android**: Native calendar dialog

```ts
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
```

---

## Component Pattern

The picker is hidden until the user taps a trigger `Pressable`. Show/hide with a boolean state:

```tsx
function DatePickerField({ label, value, onChange, error, maximumDate }: DatePickerFieldProps) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, nextValue?: Date) => {
    setIsOpen(false); // always close, even on cancel
    if (event.type !== 'set' || !nextValue) return; // 'set' = confirmed, 'dismissed' = cancelled
    onChange(nextValue);
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium" style={{ color: colors.bodyText }}>
        {label}
      </Text>

      <Pressable
        accessibilityLabel={`${label}, ${value ? format(value, 'MMMM d, yyyy') : 'not selected'}`}
        accessibilityHint="Opens a date picker"
        accessibilityRole="button"
        className="min-h-12 justify-center rounded-2xl border px-4"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: error ? colors.error : colors.border,
          borderWidth: 0.5,
        }}
        onPress={() => setIsOpen(true)}
      >
        <Text className="text-base" style={{ color: value ? colors.bodyText : colors.mutedText }}>
          {value ? format(value, 'MMMM d, yyyy') : 'Select date'}
        </Text>
      </Pressable>

      {error ? (
        <Text selectable className="text-sm" style={{ color: colors.error }}>{error}</Text>
      ) : null}

      {isOpen ? (
        <DateTimePicker
          display="default"
          mode="date"
          value={value ?? new Date(2000, 0, 1)}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
```

---

## event.type Values

| Value | Meaning |
|-------|---------|
| `'set'` | User confirmed a date — `nextValue` is the selected `Date` |
| `'dismissed'` | User cancelled (Android back / iOS Cancel) — ignore `nextValue` |
| `'neutralButtonPressed'` | "Clear" button pressed (if configured) |

Always check `event.type === 'set'` before calling `onChange`.

---

## react-hook-form Integration

Wrap with `Controller` — `field.value` is a `Date | null`:

```tsx
<Controller
  control={control}
  name="birthdate"
  render={({ field, fieldState }) => (
    <DatePickerField
      label="Date of Birth"
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
      maximumDate={new Date()}
    />
  )}
/>
```

In the zod schema, validate with `z.date()` or `z.string().datetime()` depending on what the server expects. If the API needs an ISO string, transform on submit:

```ts
const payload = { birthdate: formValues.birthdate.toISOString() };
```

---

## Platform Notes

**Android**: The picker renders as a modal dialog. `setIsOpen(false)` in the `onChange` callback is sufficient — the dialog closes itself.

**iOS**: With `display="default"`, the picker may render inline as a spinner wheel. Wrap in a modal or bottom sheet if you need the iOS calendar grid (`display="inline"` or `display="compact"`).

**Simulator**: DateTimePicker works correctly on simulators. No device-only workaround needed.

---

## Default Value

Always provide a fallback for `value` — `DateTimePicker` crashes if `value` is undefined or null:

```tsx
value={value ?? new Date(2000, 0, 1)}
```

Choose a sensible default (e.g. year 2000 for a birthdate field).

---

## Rules

- Always close the picker in `onChange` — set `isOpen` to `false` unconditionally before checking `event.type`
- Provide `accessibilityLabel` and `accessibilityHint` on the trigger `Pressable`
- Show the error message below the trigger, not inside it
- Use `colors.border` vs `colors.error` for the trigger border based on field error state
- Never render `DateTimePicker` outside a conditional — render it only when `isOpen` is true
- Format the display value with `date-fns` `format()` — not `toLocaleDateString()`
