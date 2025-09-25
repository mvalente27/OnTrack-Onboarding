// src/app/checklist-builder/[templateId]/template-item.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { ChecklistItem, Role } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

interface TemplateItemProps {
  item: ChecklistItem;
  roles: Role[];
  availableStages: string[];
  index: number;
  totalItems: number;
  onItemChange: (
    id: string,
    field: keyof ChecklistItem,
    value: string | boolean
  ) => void;
  onDeleteItem: (id: string) => void;
  onReorderItem: (index: number, direction: 'up' | 'down') => void;
}

export function TemplateItem({
  item,
  roles,
  availableStages,
  index,
  totalItems,
  onItemChange,
  onDeleteItem,
  onReorderItem,
}: TemplateItemProps) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReorderItem(index, 'up')}
              disabled={index === 0}
              aria-label="Move up"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReorderItem(index, 'down')}
              disabled={index === totalItems - 1}
              aria-label="Move down"
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            <div className="lg:col-span-3">
              <Label htmlFor={`label-${item.id}`}>Question Label</Label>
              <Input
                id={`label-${item.id}`}
                value={item.label}
                onChange={(e) => onItemChange(item.id, 'label', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`type-${item.id}`}>Question Type</Label>
              <Select
                value={item.type}
                onValueChange={(value: ChecklistItem['type']) =>
                  onItemChange(item.id, 'type', value)
                }
              >
                <SelectTrigger id={`type-${item.id}`}>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor={`role-${item.id}`}>Assigned Role</Label>
              <Select
                value={item.roleId || 'none'}
                onValueChange={(value: string) =>
                  onItemChange(item.id, 'roleId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger id={`role-${item.id}`}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div>
                <Label htmlFor={`stageName-${item.id}`}>Associated Stage</Label>
                <Select
                    value={item.stageName || 'none'}
                    onValueChange={(value: string) =>
                      onItemChange(item.id, 'stageName', value === 'none' ? '' : value)
                    }
                    disabled={availableStages.length === 0}
                >
                    <SelectTrigger id={`stageName-${item.id}`}>
                        <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {availableStages.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteItem(item.id)}
            className="text-destructive hover:text-destructive self-start"
            aria-label="Delete item"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
         <div className="flex items-center space-x-8 pl-14">
            <div className="flex items-center space-x-2">
                <Switch
                    id={`requiresFile-${item.id}`}
                    checked={item.requiresFile}
                    onCheckedChange={(checked) =>
                    onItemChange(item.id, 'requiresFile', checked)
                    }
                />
                <Label htmlFor={`requiresFile-${item.id}`}>Requires File Upload</Label>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
