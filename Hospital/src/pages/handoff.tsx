import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Plus, LogIn, LogOut, BrainCircuit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface HandoffNote {
  id: string;
  nurseId: string;
  nurseName: string;
  report: string;
  timestamp: Date;
}

interface AttendanceRecord {
  id: string;
  nurseId: string;
  nurseName: string;
  status: "Clocked In" | "Clocked Out";
  timestamp: Date;
}

interface CurrentUser {
  id: string;
  name: string;
}

const initialHandoffs: HandoffNote[] = [
  {
    id: "hn1",
    nurseId: "N78901",
    nurseName: "Nurse Aashish",
    report:
      "Patient in 401A is resting comfortably. All meds administered on schedule.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "hn2",
    nurseId: "N65432",
    nurseName: "Nurse Richa",
    report:
      "Room 405 requires a change of dressings. Supplies are stocked. Family of patient in 402B called for an update.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

export default function Handoff() {
  const [handoffs, setHandoffs] = useState<HandoffNote[]>(initialHandoffs);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [inputNurseName, setInputNurseName] = useState("");

  const [newHandoffNote, setNewHandoffNote] = useState("");

  const [isHandoffDialogOpen, setIsHandoffDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isClockInDialogOpen, setIsClockInDialogOpen] = useState(false);

  const [summary, setSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const lastAttendanceStatus = useMemo(() => {
    if (!currentUser) return "Clocked Out";

    const userAttendance = attendance
      .filter((a) => a.nurseId === currentUser.id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (userAttendance.length > 0) {
      return userAttendance[0].status;
    }
    return "Clocked Out";
  }, [attendance, currentUser]);

  const handleClockInOut = () => {
    if (currentUser && lastAttendanceStatus === "Clocked In") {
      const newRecord: AttendanceRecord = {
        id: `ar${Date.now()}`,
        nurseId: currentUser.id,
        nurseName: currentUser.name,
        status: "Clocked Out",
        timestamp: new Date(),
      };
      setAttendance((prev) => [newRecord, ...prev]);
      setCurrentUser(null);
      toast({
        title: "Success",
        description: `${currentUser.name} has been Clocked Out.`,
      });
    } else {
      setInputNurseName("");
      setIsClockInDialogOpen(true);
    }
  };

  const handleConfirmClockIn = () => {
    if (!inputNurseName.trim()) {
      toast({
        title: "Error",
        description: "Nurse name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newUser: CurrentUser = {
      id: `N${Date.now()}`,
      name: inputNurseName.trim(),
    };

    setCurrentUser(newUser);

    const newRecord: AttendanceRecord = {
      id: `ar${Date.now()}`,
      nurseId: newUser.id,
      nurseName: newUser.name,
      status: "Clocked In",
      timestamp: new Date(),
    };

    setAttendance((prev) => [newRecord, ...prev]);
    toast({
      title: "Success",
      description: `${newUser.name} has been Clocked In.`,
    });
    setIsClockInDialogOpen(false);
  };

  const handleSaveHandoff = () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be clocked in to add a note.",
        variant: "destructive",
      });
      return;
    }

    if (!newHandoffNote.trim()) {
      toast({
        title: "Error",
        description: "Handoff note cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const newNote: HandoffNote = {
      id: `hn${Date.now()}`,
      nurseId: currentUser.id,
      nurseName: currentUser.name,
      report: newHandoffNote,
      timestamp: new Date(),
    };

    setHandoffs((prev) => [newNote, ...prev]);
    toast({
      title: "Handoff Saved",
      description: "Your report has been successfully submitted.",
    });
    setIsHandoffDialogOpen(false);
    setNewHandoffNote("");
  };

  const handleGenerateSummary = () => {
    setSummary("");
    setIsSummaryDialogOpen(true);
    setIsLoadingSummary(true);

    if (handoffs.length === 0) {
      setSummary("No handoff reports available to summarize.");
      setIsLoadingSummary(false);
      return;
    }

    setTimeout(() => {
      const dummySummary = `
**Unit Status Overview:**
The unit is currently stable with a moderate census. Pay close attention to the new admission in room 305.

**Critical Patient Updates:**
* **Room 301 (Jane Doe):** Patient remains on NPO status pending morning labs. Family updated at 8:00 PM.
* **Room 302B (John Smith):** Experienced mild discomfort around 4:45 PM, resolved with PRN Tylenol. Vitals have been stable since.
* **Room 305 (New Admission):** Patient admitted for observation following a fall. Neuro checks are due every 2 hours. Awaiting initial consult from Dr. Evans.

**Pending Tasks & Concerns:**
* Follow up on the lab results for Jane Doe in Room 301 first thing.
* Ensure the care plan for the new admission in Room 305 is signed and initiated.
* Monitor John Smith (302B) for any recurring pain.
          `;
      setSummary(dummySummary.trim());
      setIsLoadingSummary(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl bg-gray-50 dark:bg-gray-900 font-sans">
      <style>{`
        body { font-family: 'Inter', sans-serif; }
        .card-shadow { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
        .btn-primary { background-color: #3b82f6; color: white; }
        .btn-primary:hover { background-color: #2563eb; }
        .btn-secondary { background-color: #6b7280; color: white; }
        .btn-secondary:hover { background-color: #4b5563; }
        .btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; border: none; transition: background-color 0.2s; }
        .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: white; text-transform: uppercase; }
        .bg-green-500 { background-color: #22c55e; }
        .bg-gray-500 { background-color: #6b7280; }
        .loading-dots span { animation: blink 1.4s infinite both; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Nurse Station</CardTitle>
              <CardDescription>
                {currentUser
                  ? `Welcome, ${currentUser.name}`
                  : "No nurse is currently clocked in."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">Current Status:</span>
                <span
                  className={`status-badge ${
                    lastAttendanceStatus === "Clocked In"
                      ? "bg-green-500"
                      : "bg-gray-500"
                  }`}
                >
                  {lastAttendanceStatus}
                </span>
              </div>
              <Button
                onClick={handleClockInOut}
                className="w-full btn btn-secondary flex items-center gap-2"
              >
                {lastAttendanceStatus === "Clocked In" ? (
                  <LogOut size={16} />
                ) : (
                  <LogIn size={16} />
                )}
                {lastAttendanceStatus === "Clocked In"
                  ? "Clock Out"
                  : "Clock In"}
              </Button>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Shift Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {attendance
                    .slice(0, 7) // Show last 7 activities
                    .map((rec) => (
                      <li
                        key={rec.id}
                        className="flex justify-between items-center"
                      >
                        <span>
                          <span className="font-semibold">{rec.nurseName}</span>
                          {rec.status === "Clocked In"
                            ? " clocked in."
                            : " clocked out."}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {rec.timestamp.toLocaleTimeString()}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No shift activity yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Shift Handoff Reports</CardTitle>
                <CardDescription>Recent notes from all nurses.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateSummary}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <BrainCircuit size={16} /> Smart Handoff
                </Button>
                <Button
                  onClick={() => {
                    if (!currentUser) {
                      toast({
                        title: "Action Required",
                        description: "Please clock in before adding a note.",
                      });
                      return;
                    }
                    setIsHandoffDialogOpen(true);
                  }}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Plus size={16} /> Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nurse</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handoffs.length > 0 ? (
                    [...handoffs]
                      .sort(
                        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
                      )
                      .map((note) => (
                        <TableRow key={note.id}>
                          <TableCell className="font-medium">
                            {note.nurseName}
                          </TableCell>
                          <TableCell>
                            {note.timestamp.toLocaleString()}
                          </TableCell>
                          <TableCell className="whitespace-pre-wrap max-w-sm truncate">
                            {note.report}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        No handoff reports yet. Be the first!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isClockInDialogOpen} onOpenChange={setIsClockInDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Clock In</DialogTitle>
            <DialogDescription>
              Please enter your name to begin your shift.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Alex Ray"
              value={inputNurseName}
              onChange={(e) => setInputNurseName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleConfirmClockIn()}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmClockIn} className="btn btn-primary">
              Confirm & Clock In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHandoffDialogOpen} onOpenChange={setIsHandoffDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Handoff Note</DialogTitle>
            <DialogDescription>
              Detail any important events, patient status changes, or pending
              tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={newHandoffNote}
              onChange={(e) => setNewHandoffNote(e.target.value)}
              placeholder="e.g., Patient in 302B requested pain medication at 4:45 PM. Dr. Smith was paged. Vitals stable."
              rows={6}
              className="w-full p-2 border rounded"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveHandoff} className="btn btn-primary">
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit /> AI-Powered Smart Handoff
            </DialogTitle>
            <DialogDescription>
              A concise summary of the latest reports to get you up to speed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isLoadingSummary ? (
              <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <div className="loading-dots">
                  <span className="inline-block w-4 h-4 bg-blue-500 rounded-full"></span>
                  <span className="inline-block w-4 h-4 bg-blue-500 rounded-full"></span>
                  <span className="inline-block w-4 h-4 bg-blue-500 rounded-full"></span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Analyzing reports...
                </p>
              </div>
            ) : (
              <div
                className="prose dark:prose-invert max-w-none whitespace-pre-wrap p-2"
                dangerouslySetInnerHTML={{
                  __html: summary
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n\n/g, "<br/><br/>")
                    .replace(/\n\* /g, "<br/>&bull; "),
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsSummaryDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
