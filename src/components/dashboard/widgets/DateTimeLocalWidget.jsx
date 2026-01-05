import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { TextField } from '@mui/material';

dayjs.extend(utc);

export const DateTimeLocalWidget = (props) => {
  const {
    options,
    value,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    disabled,
    id,
    label
  } = props;

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
  const _onChange = (event) => {
    const inputValue = event.target.value;
    if (!inputValue) {
      onChange(undefined);
      return;
    }
    // Parse input as local time (dayjs without utc plugin here),
    // then convert to UTC ISO string
    const utcValue = dayjs(inputValue).utc().toISOString();
    onChange(utcValue);
  };

  const _onBlur = (event) => {
    onBlur(id, event.target.value);
  };

  const _onFocus = (event) => {
    onFocus(id, event.target.value);
  };

  return (
    <TextField
      type="datetime-local"
      value={localDatetime}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      name={id}
      label={label}
      slotProps={{ htmlInput: { step } }}
      fullWidth
    />
  );
};
