import { useState } from 'react';
import { Mail, Phone, Copy, Check } from 'lucide-react';

interface CopyableContactProps {
  type: 'email' | 'phone';
  value: string;
  className?: string;
  showIcon?: boolean;
}

export function CopyableContact({ type, value, className = '', showIcon = true }: CopyableContactProps) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = type === 'email' ? Mail : Phone;

  return (
    <div
      className={`inline-flex items-center gap-1.5 group cursor-pointer select-text ${className}`}
      onClick={handleCopy}
      title={`Click to copy ${type}: ${value}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-600 transition-colors flex-shrink-0" />}
      <span className="select-all hover:underline hover:text-green-700 transition-colors font-medium">{value}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-green-600 transition-all ml-0.5"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      {copied && (
        <span className="text-[10px] bg-green-700 text-white px-1.5 py-0.5 rounded shadow-xs font-semibold">
          Copied!
        </span>
      )}
    </div>
  );
}
