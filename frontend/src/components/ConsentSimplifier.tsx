import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, FileText, CheckCircle, AlertTriangle, Heart, Database, ShieldCheck, Stethoscope, LoaderCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dummy content remains the same
const originalConsentText = `I, the undersigned, hereby authorize and direct Dr. Arjun Gupta and his associates or assistants to perform the following medical procedure, known as a 'cardiac catheterization', upon myself. I have been informed of the nature, consequences, risks, and benefits of this procedure, including but not limited to potential complications such as hemorrhage, infection, myocardial infarction, and adverse reactions to anesthesia. I consent to the use of my anonymized clinical data, including procedural outcomes and diagnostic imaging, for the purposes of medical research, educational advancement, and quality assurance protocols. This consent is given voluntarily and I acknowledge that I am at liberty to withdraw my consent at any time prior to the commencement of the procedure.`;

const simplifiedPoints = [
  {
    icon: <Stethoscope className="h-5 w-5 text-blue-500" />,
    title: "What is the Procedure?",
    text: "You are giving permission for Dr. Arjun Gupta to perform a cardiac catheterization. This is a test where a thin tube is guided to your heart to check for any problems."
  },
  {
    icon: <Heart className="h-5 w-5 text-green-500" />,
    title: "What are the Benefits?",
    text: "This test helps the doctor get a clear picture of your heart's health to decide the best possible treatment for you."
  },
  {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    title: "What are the Risks?",
    text: "There's a small chance of issues like bleeding, infection, or a reaction to the medicine that helps you relax. Serious problems are very rare."
  },
  {
    icon: <Database className="h-5 w-5 text-purple-500" />,
    title: "How is Your Data Used?",
    text: "Your medical data, with your name and personal details removed, might be used for research to help improve medical science. Your privacy is protected."
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-yellow-500" />,
    title: "What are Your Rights?",
    text: "You can change your mind and cancel this consent at any point before the procedure begins. Your decision will be respected."
  },
];

export default function ConsentSimplifier() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  const [inputText, setInputText] = useState(originalConsentText);
  
  const resultsRef = useRef(null);

  const handleSimplifyClick = () => {
    if (!inputText) return;
    setIsLoading(true);
    setIsSimplified(false);

    setTimeout(() => {
      setIsLoading(false);
      setIsSimplified(true);
    }, 1500);
  };

  useEffect(() => {
    if (isSimplified && resultsRef.current) {
      resultsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [isSimplified]);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6  min-h-screen">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8" // Reduced margin
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-800">
          AI Consent Form Simplifier
        </h1>
        <p className="text-base md:text-lg text-gray-500 mt-2">
          Making complex medical documents easy to understand.
        </p>
      </motion.header>

      {/* Main Content Area with less vertical space */}
      <div className="space-y-6">
        
        {/* Input Panel */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <FileText className="h-6 w-6" /> Paste Your Consent Form Here
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Paste the complex medical text here..."
                className="w-full h-56 text-sm bg-white focus:ring-2 focus:ring-blue-400" // Reduced height
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button 
                onClick={handleSimplifyClick}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-base flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="animate-spin h-5 w-5" />
                    Simplifying...
                  </>
                ) : (
                  <>
                    Simplify Now <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Panel */}
        <AnimatePresence>
          {isSimplified && (
            <motion.div
              ref={resultsRef} 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Card className="shadow-md bg-white border-green-300 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-green-800">
                    <CheckCircle className="h-6 w-6" /> Simplified Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Tighter spacing for results list */}
                  <div className="space-y-3">
                    {simplifiedPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100">
                        <div className="flex-shrink-0 mt-0.5">{point.icon}</div>
                        <div>
                          <h3 className="font-bold text-gray-800">{point.title}</h3>
                          <p className="text-gray-600 text-sm leading-snug">{point.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}