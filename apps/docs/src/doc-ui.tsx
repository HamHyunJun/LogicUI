import * as React from 'react';

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      <span>{label}</span>
    </label>
  );
}

// 가로로 넘치는 코드는 키보드로도 스크롤할 수 있어야 하므로 tabIndex를 둔다.
export function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className="overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-900"
    >
      <code className="font-mono">{code}</code>
    </pre>
  );
}

export interface PropDoc {
  name: string;
  type: string;
  description: string;
  /** 기본값. 없으면 표시하지 않는다. */
  default?: string;
}

export interface PartDoc {
  name: string;
  description?: string;
  props?: PropDoc[];
}

export function ApiTable({ parts }: { parts: PartDoc[] }) {
  return (
    <div className="grid gap-8">
      {parts.map((part) => (
        <div key={part.name}>
          <h3 className="font-mono text-base font-semibold">{part.name}</h3>
          {part.description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{part.description}</p>}
          {part.props && part.props.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{part.name} Props</caption>
                <thead className="bg-zinc-100 dark:bg-zinc-900">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">Prop</th>
                    <th scope="col" className="px-4 py-2 font-medium">타입</th>
                    <th scope="col" className="px-4 py-2 font-medium">설명</th>
                  </tr>
                </thead>
                <tbody>
                  {part.props.map((prop) => (
                    <tr key={prop.name} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                      <th scope="row" className="px-4 py-2 font-mono text-xs font-medium whitespace-nowrap">{prop.name}</th>
                      <td className="px-4 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">{prop.type}</td>
                      <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                        {prop.description}
                        {prop.default && (
                          <>
                            {' '}
                            기본값 <code className="font-mono text-xs">{prop.default}</code>.
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function KeyTable({ keys }: { keys: Array<[string, string]> }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">키보드 인터랙션</caption>
        <thead className="bg-zinc-100 dark:bg-zinc-900">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">키</th>
            <th scope="col" className="px-4 py-2 font-medium">동작</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(([key, action]) => (
            <tr key={key} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="px-4 py-2 whitespace-nowrap">
                <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-xs dark:border-zinc-700">{key}</kbd>
              </td>
              <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
