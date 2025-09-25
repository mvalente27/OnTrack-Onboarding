// src/app/leads/[leadId]/form/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// TODO: Refactor to use Azure services
import type { ChecklistTemplate, ChecklistItem, Lead } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

function renderFormControl(item: ChecklistItem, value: any, onChange: (value: any) => void) {
  const props = {
    id: item.id,
    value: value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    required: true,
  };

  switch (item.type) {
    case 'text':
      return <Input {...props} type="text" />;
    case 'number':
      return <Input {...props} type="number" />;
    case 'date':
      return <Input {...props} type="date" />;
    case 'textarea':
      return <Textarea {...props} rows={3} />;
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2 h-10">
          <Checkbox
            id={item.id}
            checked={!!value}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={item.id} className="text-sm font-medium leading-none">
            {item.label}
          </Label>
        </div>
      );
    default:
      return <Input {...props} type="text" />;
  }
}

export default function LeadFormPage() {
  const params = useParams();
  const leadId = params.leadId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!leadId) return;

    const fetchLeadInfo = async () => {
      try {
        const result = await getLeadAndTemplate(leadId);
        if (result) {
          setLead(result.lead);
          setTemplate(result.template);
          
          const initialData: Record<string, any> = {};
          result.template.items.forEach(item => {
             initialData[item.label] = result.lead[item.label as keyof Lead] || (item.type === 'checkbox' ? false : '');
          });
          setFormData(initialData);

        } else {
          toast({ title: 'Invalid Form Link', description: 'This form link is either expired or incorrect.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error fetching lead and template:', error);
        toast({ title: 'Error', description: 'Could not load the form.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeadInfo();
  }, [leadId, toast]);
  
  const handleInputChange = (label: string, value: any) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await updateLeadData(leadId, formData);
        setIsSubmitted(true);
    } catch(error) {
        console.error('Failed to submit form', error);
        toast({ title: 'Submission Error', description: 'There was a problem submitting your information.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Card className="max-w-lg w-full m-4">
            <CardHeader>
                <CardTitle>Form Not Available</CardTitle>
                <CardDescription>This form link may be invalid or the lead may no longer be active. Please contact us if you believe this is an error.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
         <div className="flex items-center justify-center min-h-screen bg-muted">
            <Card className="max-w-lg w-full m-4 text-center">
                <CardHeader>
                    <CardTitle>Thank You!</CardTitle>
                    <CardDescription>Your information has been successfully submitted.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>We have received your details and will be in touch shortly.</p>
                </CardContent>
            </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">Project Data Sheet</CardTitle>
                <CardDescription>Please complete the following form for <strong>{lead.clientName}</strong>. Your information will help us get started.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {template.items.map(item => (
                         <div key={item.id} className="grid grid-cols-1 gap-2">
                            {item.type !== 'checkbox' && <Label htmlFor={item.id} className="text-base">{item.label}</Label>}
                            {renderFormControl(item, formData[item.label], (value) => handleInputChange(item.label, value))}
                        </div>
                    ))}
                    <Separator />
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isSubmitting} size="lg">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="mr-2" /> Submit Information</>}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
