import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Stethoscope } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Define real input schema
const formSchema = z.object({
  mainSymptom: z.string().min(2, 'Please select a main symptom'),
  duration: z.string().min(1, 'Please enter duration'),
  severity: z.string().min(1, 'Please select severity'),
  additionalSymptoms: z.string(),
});

// Dummy analysis fields (not part of submission)
const dummyFields = [
  { label: 'Body Temperature', placeholder: 'e.g., 98.6°F' },
  { label: 'Heart Rate', placeholder: 'e.g., 72 bpm' },
  { label: 'Blood Pressure', placeholder: 'e.g., 120/80 mmHg' },
  { label: 'Mood Level', placeholder: 'e.g., Tired, Normal, Stressed' },
];

const symptoms = ['Fever', 'Headache', 'Cough', 'Fatigue', 'Shortness of breath', 'Chest pain', 'Nausea', 'Dizziness'];

const severityLevels = ['Mild - Barely noticeable', 'Moderate - Noticeable but manageable', 'Severe - Significantly affecting daily life', 'Very Severe - Need immediate attention'];

export default function DiseaseDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [dummyData, setDummyData] = useState<Record<string, string>>({}); // Holds fake inputs
  const [showWarning, setShowWarning] = useState(true); // Show modal on load

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      additionalSymptoms: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsAnalyzing(true);
    setDiagnosis(null);

    // Convert camelCase to snake_case for API compatibility
    const payload = {
      main_symptom: values.mainSymptom,
      duration: values.duration,
      severity: values.severity,
      additional_symptoms: values.additionalSymptoms,
    };

    try {
      const response = await fetch('https://dot.etoqe.shop/disease-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error('Failed to fetch diagnosis');
      }

      const data = await response.json();
      setDiagnosis(data);
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }
  console.log(dummyData)
  return (
    <>
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader className="flex flex-col items-center text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
            <DialogTitle className="text-xl font-bold ">
              Important Medical Disclaimer
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-gray-700 text-md space-y-3">
            <p>
              This AI-powered system provides preliminary insights only and
              <span className="font-semibold text-red-500"> does not replace professional medical consultation.</span>
            </p>

            <p>
              🚑 In case of a medical emergency, please contact a qualified healthcare provider immediately.
            </p>

            <p>
              🔍 <span className="font-medium">Your data will be securely shared</span> with our medical professionals for further examination and guidance.
            </p>
          </DialogDescription>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setShowWarning(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
            >
              I Understand & Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6" />
              AI-Powered Disease Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Dummy Fields Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg shadow-inner">
                  <p className="col-span-2 text-sm text-gray-600 mb-2">
                    Gathering additional biometric data for better analysis...[Optional]
                  </p>
                  {dummyFields.map(({ label, placeholder }) => (
                    <Input
                      key={label}
                      placeholder={placeholder}
                      className="w-full bg-white"
                      onChange={(e) => setDummyData((prev) => ({ ...prev, [label]: e.target.value }))}
                    />
                  ))}
                </div>

                {/* Real Inputs */}
                <FormField
                  control={form.control}
                  name="mainSymptom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Symptom</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your main symptom" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {symptoms.map((symptom) => (
                            <SelectItem key={symptom} value={symptom.toLowerCase()}>
                              {symptom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3 days" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {severityLevels.map((level) => (
                            <SelectItem key={level} value={level.toLowerCase()}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalSymptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Symptoms or Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe any other symptoms or relevant information..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Symptoms...
                    </>
                  ) : (
                    'Analyze Symptoms'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {diagnosis && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Possible Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                Our AI has identified possible conditions based on your symptoms.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>

  );
}
