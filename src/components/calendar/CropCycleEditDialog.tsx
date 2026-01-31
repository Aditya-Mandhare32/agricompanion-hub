import React from 'react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sampleCrops, getSuggestedPlantingWindow } from '@/lib/sampleCrops';
import { Layers, Trash2, Save } from 'lucide-react';

interface CropCycle {
  id: string;
  cropId: string;
  cropName: string;
  startDate: Date;
  endDate: Date;
  region: string;
  color: string;
  notes?: string;
}

interface CropCycleEditDialogProps {
  cycle: CropCycle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cycle: CropCycle) => void;
  onDelete: (id: string) => void;
  regions: string[];
}

export function CropCycleEditDialog({
  cycle,
  isOpen,
  onClose,
  onSave,
  onDelete,
  regions,
}: CropCycleEditDialogProps) {
  const [editedCycle, setEditedCycle] = React.useState<CropCycle | null>(null);

  React.useEffect(() => {
    if (cycle) {
      setEditedCycle({ ...cycle });
    }
  }, [cycle]);

  if (!editedCycle) return null;

  const crop = sampleCrops.find((c) => c.id === editedCycle.cropId);

  const handleCropChange = (cropId: string) => {
    const newCrop = sampleCrops.find((c) => c.id === cropId);
    if (newCrop) {
      setEditedCycle({
        ...editedCycle,
        cropId,
        cropName: newCrop.name,
        color: newCrop.color,
        endDate: addDays(editedCycle.startDate, newCrop.growthDurationDays),
      });
    }
  };

  const handleStartDateChange = (dateStr: string) => {
    const newStartDate = new Date(dateStr);
    const duration = crop?.growthDurationDays || 90;
    setEditedCycle({
      ...editedCycle,
      startDate: newStartDate,
      endDate: addDays(newStartDate, duration),
    });
  };

  const handleSave = () => {
    if (editedCycle) {
      onSave(editedCycle);
      onClose();
    }
  };

  const handleDelete = () => {
    if (editedCycle) {
      onDelete(editedCycle.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Edit Crop Cycle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Crop</Label>
            <Select value={editedCycle.cropId} onValueChange={handleCropChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a crop" />
              </SelectTrigger>
              <SelectContent>
                {sampleCrops.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {crop && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">
                {
                  getSuggestedPlantingWindow(editedCycle.cropId, editedCycle.region)
                    .suggestion
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Duration: {crop.growthDurationDays} days
              </p>
            </div>
          )}

          <div>
            <Label>Region</Label>
            <Select
              value={editedCycle.region}
              onValueChange={(v) => setEditedCycle({ ...editedCycle, region: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={format(editedCycle.startDate, 'yyyy-MM-dd')}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={format(editedCycle.endDate, 'yyyy-MM-dd')}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any notes..."
              value={editedCycle.notes || ''}
              onChange={(e) =>
                setEditedCycle({ ...editedCycle, notes: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
