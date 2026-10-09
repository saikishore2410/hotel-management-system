import { CircleAlert, CircleCheck, X } from 'lucide-react';
export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.tone === 'error';
  const Icon = isError ? CircleAlert : CircleCheck;
  return <div role={isError ? 'alert' : 'status'} className={`fixed bottom-4 left-4 right-4 z-50 flex animate-fade-in items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg motion-reduce:animate-none sm:left-auto sm:max-w-sm ${isError ? 'bg-occ-ink text-white' : 'bg-ink text-white'}`}>
    <Icon className={`mt-0.5 size-4 shrink-0 ${isError ? '' : 'text-avail'}`} aria-hidden="true" />
    <p className="flex-1">{toast.message}</p>
    <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="text-white/70 hover:text-white focus-visible:outline-brass-light"><X className="size-4" aria-hidden="true" /></button>
  </div>;
}
