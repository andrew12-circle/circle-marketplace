import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Trash2, Brain, Tag, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIKnowledgeEntry {
  id?: string;
  service_id: string;
  title: string;
  knowledge_type: string;
  content: string;
  tags: string[];
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ServiceAIResearchEditorProps {
  serviceId: string;
  serviceName: string;
}

const KNOWLEDGE_TYPES = [
  { value: 'overview', label: 'Service Overview' },
  { value: 'benefits', label: 'Key Benefits' },
  { value: 'use_cases', label: 'Use Cases' },
  { value: 'best_practices', label: 'Best Practices' },
  { value: 'comparisons', label: 'Comparisons' },
  { value: 'roi_insights', label: 'ROI Insights' },
  { value: 'market_positioning', label: 'Market Positioning' },
  { value: 'customer_profile', label: 'Ideal Customer Profile' },
  { value: 'implementation', label: 'Implementation Guide' },
  { value: 'troubleshooting', label: 'Common Issues' },
];

export const ServiceAIResearchEditor = ({ serviceId, serviceName }: ServiceAIResearchEditorProps) => {
  const [entries, setEntries] = useState<AIKnowledgeEntry[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIKnowledgeEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledgeEntries();
  }, [serviceId]);

  const fetchKnowledgeEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('service_ai_knowledge')
        .select('*')
        .eq('service_id', serviceId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries((data as any) || []);
    } catch (error) {
      console.error('Error fetching AI knowledge:', error);
      toast({
        title: "Error",
        description: "Failed to load AI knowledge entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (entry?: AIKnowledgeEntry) => {
    if (entry) {
      setEditForm({
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : []
      });
      setIsEditing(entry.id || 'new');
    } else {
      setEditForm({
        service_id: serviceId,
        title: '',
        knowledge_type: 'overview',
        content: '',
        tags: [],
        priority: 5,
        is_active: true
      });
      setIsEditing('new');
    }
  };

  const handleSave = async () => {
    if (!editForm.title || !editForm.content) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditing === 'new') {
        const { data, error } = await supabase
          .from('service_ai_knowledge')
          .insert([editForm as any])
          .select()
          .single();

        if (error) throw error;
        setEntries(prev => [(data as any), ...prev]);
      } else {
        const { data, error } = await supabase
          .from('service_ai_knowledge')
          .update(editForm as any)
          .eq('id', isEditing)
          .select()
          .single();

        if (error) throw error;
        setEntries(prev => prev.map(e => e.id === isEditing ? (data as any) : e));
      }

      setIsEditing(null);
      setEditForm({});
      toast({
        title: "Success",
        description: "AI knowledge entry saved successfully",
      });
    } catch (error) {
      console.error('Error saving AI knowledge:', error);
      toast({
        title: "Error",
        description: "Failed to save AI knowledge entry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI knowledge entry?')) return;

    try {
      const { error } = await supabase
        .from('service_ai_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEntries(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Success",
        description: "AI knowledge entry deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting AI knowledge:', error);
      toast({
        title: "Error",
        description: "Failed to delete AI knowledge entry",
        variant: "destructive",
      });
    }
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setEditForm(prev => ({ ...prev, tags }));
  };

  const adjustPriority = async (id: string, direction: 'up' | 'down') => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const newPriority = direction === 'up' ? entry.priority + 1 : entry.priority - 1;
    const clampedPriority = Math.max(1, Math.min(10, newPriority));

    try {
      const { error } = await supabase
        .from('service_ai_knowledge')
        .update({ priority: clampedPriority })
        .eq('id', id);

      if (error) throw error;
      
      setEntries(prev => prev
        .map(e => e.id === id ? { ...e, priority: clampedPriority } : e)
        .sort((a, b) => b.priority - a.priority)
      );
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading AI knowledge entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Research for {serviceName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Curated knowledge that the AI Concierge will use when recommending this service
          </p>
        </div>
        <Button onClick={() => handleStartEdit()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Knowledge Entry
        </Button>
      </div>

      {isEditing && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-base">
              {isEditing === 'new' ? 'New' : 'Edit'} AI Knowledge Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter knowledge entry title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Knowledge Type</label>
                <Select
                  value={editForm.knowledge_type || ''}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, knowledge_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select knowledge type" />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWLEDGE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content (Markdown supported)</label>
              <Textarea
                value={editForm.content || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter detailed knowledge content that AI will use for recommendations..."
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={editForm.tags?.join(', ') || ''}
                  onChange={(e) => handleTagInput(e.target.value)}
                  placeholder="feature, benefit, pricing..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority (1-10)</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={editForm.priority || 5}
                  onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={editForm.is_active || false}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <span className="text-sm">Active</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No AI Knowledge Entries</h4>
              <p className="text-muted-foreground mb-4">
                Add curated knowledge to help the AI Concierge provide better recommendations for this service.
              </p>
              <Button onClick={() => handleStartEdit()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{entry.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {KNOWLEDGE_TYPES.find(t => t.value === entry.knowledge_type)?.label || entry.knowledge_type}
                      </Badge>
                      <Badge variant={entry.is_active ? "default" : "secondary"} className="text-xs">
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Priority: {entry.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.content}
                    </p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {entry.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => adjustPriority(entry.id!, 'up')}
                      disabled={entry.priority >= 10}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => adjustPriority(entry.id!, 'down')}
                      disabled={entry.priority <= 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};