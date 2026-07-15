export default function Checkbox({ id, label, ...props }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2.5 select-none">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-primary transition-colors duration-200 focus:ring-2 focus:ring-primary/30 dark:border-slate-500 dark:bg-slate-800"
        {...props}
      />
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
    </label>
  )
}
