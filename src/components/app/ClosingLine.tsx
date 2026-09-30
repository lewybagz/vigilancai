export function ClosingLine({ text = "Everything else is unchanged." }: { text?: string }) {
  return (
    <div className="mt-12 border-t border-hairline pt-8">
      <p className="text-[15px] text-fog">{text}</p>
    </div>
  );
}
