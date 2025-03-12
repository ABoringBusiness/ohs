import { useActiveHost } from "#/hooks/query/use-active-host";

export function MobileLabel() {
  const { activeHost } = useActiveHost();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">Mobile</div>
      </div>
      {activeHost && <div className="w-2 h-2 bg-green-500 rounded-full" />}
    </div>
  );
}
