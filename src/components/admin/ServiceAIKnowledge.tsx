import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIKnowledge {
  id: string;
  knowledge_type: string;
  title: string;
  content: string;
  tags: string[];
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface ServiceAIKnowledgeProps {
  serviceId: string;
}

export function ServiceAIKnowledge({ serviceId }: ServiceAIKnowledgeProps) {
  const [knowledge, setKnowledge] = useState<AIKnowledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    knowledge_type: 'general',
    title: '',
    content: '',
    tags: '',
    priority: 5,
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledge();
  }, [serviceId]);

  const fetchKnowledge = async () => {
    try {
      const { data, error } = await supabase
        .from('service_ai_knowledge')
        .select('*')
        .eq('service_id', serviceId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledge(data || []);
    } catch (error) {
      console.error('Error fetching AI knowledge:', error);
      toast({ title: "Error", description: "Failed to load AI knowledge", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      if (editingId) {
        const { error } = await supabase
          .from('service_ai_knowledge')
          .update({
            knowledge_type: formData.knowledge_type,
            title: formData.title,
            content: formData.content,
            tags: tagsArray,
            priority: formData.priority,
            is_active: formData.is_active,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: "Success", description: "AI knowledge updated" });
      } else {
        const { error } = await supabase
          .from('service_ai_knowledge')
          .insert({
            service_id: serviceId,
            knowledge_type: formData.knowledge_type,
            title: formData.title,
            content: formData.content,
            tags: tagsArray,
            priority: formData.priority,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: "Success", description: "AI knowledge added" });
      }

      resetForm();
      fetchKnowledge();
    } catch (error) {
      console.error('Error saving AI knowledge:', error);
      toast({ title: "Error", description: "Failed to save AI knowledge", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_ai_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "AI knowledge deleted" });
      fetchKnowledge();
    } catch (error) {
      console.error('Error deleting AI knowledge:', error);
      toast({ title: "Error", description: "Failed to delete AI knowledge", variant: "destructive" });
    }
  };

  const handleEdit = (item: AIKnowledge) => {
    setFormData({
      knowledge_type: item.knowledge_type,
      title: item.title,
      content: item.content,
      tags: item.tags.join(', '),
      priority: item.priority,
      is_active: item.is_active,
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      knowledge_type: 'general',
      title: '',
      content: '',
      tags: '',
      priority: 5,
      is_active: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return <div className="p-4">Loading AI knowledge...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">AI Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">
            Preload data for the AI concierge to reference before searching the web
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Knowledge
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} AI Knowledge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="knowledge_type">Type</Label>
                  <Select value={formData.knowledge_type} onValueChange={(value) => setFormData({...formData, knowledge_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="features">Features</SelectItem>
                      <SelectItem value="benefits">Benefits</SelectItem>
                      <SelectItem value="comparison">Comparison</SelectItem>
                      <SelectItem value="requirements">Requirements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Brief title for this knowledge item"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Detailed information about this service..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="pricing, features, benefits"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingId ? 'Update' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {knowledge.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No AI knowledge entries yet. Add some to help the concierge provide better answers.</p>
            </CardContent>
          </Card>
        ) : (
          knowledge.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{item.knowledge_type}</Badge>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm">Priority: {item.priority}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{item.content}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}