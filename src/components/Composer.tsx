import { useState, type SyntheticEvent } from 'react';
import type { Content } from '../content/types';
import { IconSend } from './Icons';

interface Props {
  t: Content;
  onSubmit: (text: string) => void;
}

export function Composer({ t, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const empty = value.trim().length === 0;

  const submit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (empty) return;
    onSubmit(value);
    setValue('');
  };

  return (
    <form className="composer" onSubmit={submit}>
      <input
        className="composer-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.ui.placeholder}
        aria-label={t.ui.placeholder}
        autoComplete="off"
        enterKeyHint="send"
        maxLength={200}
      />
      <button type="submit" className="composer-send" disabled={empty} aria-label={t.ui.send} title={t.ui.send}>
        <IconSend size={20} />
      </button>
    </form>
  );
}
