import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit, Save, X, Plus } from 'lucide-react';
import { useRESPADisclaimers } from '@/hooks/useRESPADisclaimers';

interface DisclaimerForm {
  title: string;
  content: string;
  button_text: string;
  button_url: string;
  is_active: boolean;
}

export const RESPADisclaimerManager = () => {
  const { disclaimers, loading, updateDisclaimer, createDisclaimer } = useRESPADisclaimers();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<DisclaimerForm>({
    title: '',
    content: '',
    button_text: 'Learn more',
    button_url: '',
    is_active: true
  });

  const handleEdit = (disclaimer: any) => {
    setEditingId(disclaimer.id);
    setFormData({
      title: disclaimer.title,
      content: disclaimer.content,
      button_text: disclaimer.button_text,
      button_url: disclaimer.button_url || '',
      is_active: disclaimer.is_active
    });
  };

  const handleSave = async () => {
    if (editingId) {
      await updateDisclaimer(editingId, formData);
      setEditingId(null);
    } else if (isCreating) {
      await createDisclaimer(formData);
      setIsCreating(false);
    }
    
    setFormData({
      title: '',
      content: '',
      button_text: 'Learn more',
      button_url: '',
      is_active: true
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      title: '',
      content: '',
      button_text: 'Learn more',
      button_url: '',
      is_active: true
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      content: '',
      button_text: 'Learn more',
      button_url: '',
      is_active: true
    });
  };

  if (loading) {
    return <div className="p-4">Loading disclaimers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">RESPA Disclaimer Management</h2>
        <Button onClick={handleCreate} disabled={isCreating || !!editingId}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Disclaimer
        </Button>
      </div>

      {/* Create New Form */}
      {isCreating && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Create New Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Circle COVERAGE - Compliant Advertising Partnerships"
              />
            </div>
            
            <div>
              <Label htmlFor="new-content">Content</Label>
              <Textarea
                id="new-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the disclaimer content..."
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-button-text">Button Text</Label>
                <Input
                  id="new-button-text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="Learn more"
                />
              </div>
              
              <div>
                <Label htmlFor="new-button-url">Button URL</Label>
                <Input
                  id="new-button-url"
                  value={formData.button_url}
                  onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                  placeholder="/legal/buyer-protection"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="new-is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
              />
              <Label htmlFor="new-is-active">Active</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Create
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Disclaimers */}
      <div className="grid gap-4">
        {disclaimers.map((disclaimer) => (
          <Card key={disclaimer.id} className={editingId === disclaimer.id ? "border-primary" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{disclaimer.title}</CardTitle>
                <Badge variant={disclaimer.is_active ? "default" : "secondary"}>
                  {disclaimer.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(disclaimer)}
                disabled={editingId === disclaimer.id || isCreating}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent>
              {editingId === disclaimer.id ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-button-text">Button Text</Label>
                      <Input
                        id="edit-button-text"
                        value={formData.button_text}
                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-button-url">Button URL</Label>
                      <Input
                        id="edit-button-url"
                        value={formData.button_url}
                        onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-is-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="edit-is-active">Active</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{disclaimer.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Button: "{disclaimer.button_text}"</span>
                    {disclaimer.button_url && (
                      <span>URL: {disclaimer.button_url}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(disclaimer.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
