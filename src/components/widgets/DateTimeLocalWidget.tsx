import { useAppColorScheme } from '@/hooks/useAppColorSchema';
import { TextField } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import dayjs from 'dayjs';

export const DateTimeLocalWidget = (props: WidgetProps) => {
  const {
    options,
    value,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    disabled,
    id,
    label,
  } = props;

  const [mode] = useAppColorScheme();

  const step = options.step || 1;

  // Convert the UTC value (ISO string) to local datetime string for input
  // Must be in 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DDTHH:mm:ss' format for datetime-local input
  const localDatetime = value
    ? dayjs
        .utc(value)
        .local()
        .format(options.format || 'YYYY-MM-DDTHH:mm:ss')
    : '';

  // When the input changes: parse the local datetime string, convert to UTC ISO string
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (!inputValue) {
      onChange(undefined);
      return;
    }
    // Parse input as local time (dayjs without utc plugin here),
    // then convert to UTC ISO string
    const utcValue = dayjs(inputValue)
      .utc()
      .toISOString()
      .replace(/Z$/, '+00:00');
    onChange(utcValue);
  };

  return (
    <TextField
      type="datetime-local"
      value={localDatetime}
      onChange={handleChange}
      onBlur={(event) => {
        onBlur(id, event.target.value);
      }}
      onFocus={(event) => {
        onFocus(id, event.target.value);
      }}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      name={id}
      label={label}
      slotProps={{
        htmlInput: {
          step,
          min: options.min,
          max: options.max,
          style: {
            colorScheme: mode,
          },
        },
      }}
    />
  );
};
