import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SafeHTML } from "@/utils/htmlSanitizer";

interface AnswerItem {
  id: string;
  title: string;
  content: string;
}

interface AnswerDropdownProps {
  items: AnswerItem[];
  label?: string;
  placeholder?: string;
}

export const AnswerDropdown = ({ items, label = "Select an answer", placeholder = "Choose..." }: AnswerDropdownProps) => {
  const [selectedId, setSelectedId] = useState<string>(items?.[0]?.id || "");
  const selected = items.find(i => i.id === selectedId) || items[0];

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-muted-foreground text-sm">
          No answer content available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{label}</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border z-[60]">
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border">
        <CardContent className="p-4">
          {selected?.content ? (
            <SafeHTML html={selected.content} />
          ) : (
            <p className="text-muted-foreground text-sm">No content for this selection.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
