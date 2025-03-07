import { Badge } from "#/components/ui/badge";

interface BadgeForSuggestionProps {
  text: string;
}

export function BadgeForSuggestion({ text }: BadgeForSuggestionProps) {
  return (
    <Badge
      variant="outline"
      className="flex gap-x-2 p-2 border-gray-700 rounded-2xl"
    >
      <p className="text-white">{text}</p>
      <img
        src="/test/rightarrowicon.png"
        alt="rightarrowicon"
        className="filter invert brightness-200 h-4 w-4"
      />
    </Badge>
  );
}
