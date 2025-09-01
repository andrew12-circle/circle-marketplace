import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File;
  open: boolean;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
  aspectRatio?: number; // 1 for square, 16/9 for landscape, etc.
}

export const ImageCropper = ({ 
  imageFile, 
  open, 
  onClose, 
  onCrop, 
  aspectRatio = 1 
}: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [zoom, setZoom] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;
    
    setCrop(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMouse]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const cropSize = Math.min(img.naturalWidth, img.naturalHeight);
    
    // Set canvas size to desired output (512x512 for square)
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate crop area
    const scale = zoom[0];
    const cropX = (img.naturalWidth - cropSize) / 2 + crop.x / scale;
    const cropY = (img.naturalHeight - cropSize) / 2 + crop.y / scale;

    // Clear canvas
    ctx.clearRect(0, 0, outputSize, outputSize);
    
    // Apply rotation
    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw cropped image
    ctx.drawImage(
      img,
      Math.max(0, cropX),
      Math.max(0, cropY),
      cropSize,
      cropSize,
      -outputSize / 2,
      -outputSize / 2,
      outputSize,
      outputSize
    );
    
    ctx.restore();

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onCrop(croppedFile);
      }
    }, 'image/jpeg', 0.9);
  }, [imageFile, zoom, rotation, crop, onCrop]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div 
            className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted"
            style={{ aspectRatio }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageUrl && (
              <>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop preview"
                  className="w-full h-full object-cover cursor-move"
                  style={{
                    transform: `scale(${zoom[0]}) rotate(${rotation}deg) translate(${crop.x}px, ${crop.y}px)`,
                    transformOrigin: 'center'
                  }}
                  draggable={false}
                />
                <div className="absolute inset-0 border-2 border-primary pointer-events-none" />
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut className="w-4 h-4" />
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4" />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation(prev => prev + 90)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            Crop & Upload
          </Button>
        </DialogFooter>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};