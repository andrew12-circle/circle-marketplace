import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FunnelSectionEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export const FunnelSectionEditor = ({ data, onChange }: FunnelSectionEditorProps) => {
  const handleBasicInfoChange = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="headline">Main Headline</Label>
            <Input
              id="headline"
              value={data.headline || ""}
              onChange={(e) => handleBasicInfoChange('headline', e.target.value)}
              placeholder="Enter compelling headline..."
            />
          </div>
          <div>
            <Label htmlFor="subHeadline">Sub-headline</Label>
            <Textarea
              id="subHeadline"
              value={data.subHeadline || ""}
              onChange={(e) => handleBasicInfoChange('subHeadline', e.target.value)}
              placeholder="Supporting description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};