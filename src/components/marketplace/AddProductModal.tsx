// @ts-nocheck
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Upload, X } from "lucide-react";
import { SecureForm } from "@/components/common/SecureForm";
import { commonRules } from "@/hooks/useSecureInput";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
}

export const AddProductModal = ({ open, onOpenChange, onProductAdded }: AddProductModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    vendor_location: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Accountability",
    "Admin, Media & Marketing", 
    "AI Assistants",
    "All-in-One",
    "Analytics & Forecasting",
    "Branding",
    "Business Services",
    "Client Gifting",
    "Coaching",
    "Compliance & Property Tools",
    "CRM",
    "CRM Software",
    "Design Tools",
    "Digital Ads",
    "E-Signature & Compliance",
    "Email & SMS Automation",
    "Lead Generation",
    "Lead Management",
    "Listing Presentations",
    "Luxury Coaching",
    "Mailers",
    "Marketing",
    "Marketing Coaching",
    "Photography & Visuals",
    "Pre-Foreclosure",
    "Predictive Analytics",
    "SEO Optimization",
    "Social Media Coaching",
    "Social Media Management",
    "Technology",
    "Transaction Management",
    "Video Marketing",
    "Virtual Assistants",
    "Virtual Staging",
    "Webinar",
    "Websites / IDX"
  ];

  const handleSecureSubmit = async (sanitizedData: Record<string, string>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add products");
        return;
      }

      const { error } = await supabase
        .from('services')
        .insert({
          title: sanitizedData.title,
          description: sanitizedData.description,
          retail_price: sanitizedData.price,
          category: sanitizedData.category,
          image_url: sanitizedData.image_url,
          vendor_id: user.id
        });

      if (error) throw error;

      toast.success("Product added successfully!");
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
        vendor_location: ""
      });
      onProductAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("Failed to add product");
    }
  };

  const validationRules = {
    title: { ...commonRules.name, required: true },
    description: { ...commonRules.description, required: true },
    price: { 
      required: true, 
      type: 'string' as const,
      pattern: /^\d+(\.\d{1,2})?$/,
      sanitize: true 
    },
    category: { required: true, type: 'string' as const, sanitize: true },
    image_url: { ...commonRules.url },
    vendor_location: { required: true, type: 'string' as const, sanitize: true }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Product
          </DialogTitle>
        </DialogHeader>

        <SecureForm
          validationRules={validationRules}
          onSubmit={handleSecureSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Product Title</Label>
            <Input
              name="title"
              id="title"
              defaultValue={formData.title}
              placeholder="Enter product title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              name="description"
              id="description"
              defaultValue={formData.description}
              placeholder="Describe your product"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                name="price"
                id="price"
                type="text"
                defaultValue={formData.price}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                name="category"
                id="category"
                defaultValue={formData.category}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              name="image_url"
              id="image_url"
              type="url"
              defaultValue={formData.image_url}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor_location">Location</Label>
            <Input
              name="vendor_location"
              id="vendor_location"
              defaultValue={formData.vendor_location}
              placeholder="City, State"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Add Product
            </Button>
          </div>
        </SecureForm>
      </DialogContent>
    </Dialog>
  );
};