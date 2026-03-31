// Simple form hook — avoids a full library dependency
import { useState } from 'react';

export function useForm(initial) {
  const [form, setForm] = useState(initial);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return [form, setField];
}
