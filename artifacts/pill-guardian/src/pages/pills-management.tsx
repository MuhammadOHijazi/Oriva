import { useState } from "react";
import { Layout } from "@/components/layout";
import { usePills, usePillMutations } from "@/hooks/use-pills";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, Clock, Pill as PillIcon, Bell, Calendar } from "lucide-react";
import type { Pill } from "@workspace/api-client-react";
import { useAlarmContext } from "@/context/alarm-context";

const ALL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
type Day = typeof ALL_DAYS[number];

const pillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  steps: z.string(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be HH:MM format"),
  daysOfWeek: z.string().min(1, "Select at least one day"),
});

type PillFormData = z.infer<typeof pillSchema>;

function DayPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const selected = value ? value.split(",").map((d) => d.trim()).filter(Boolean) : [];

  const toggle = (day: Day) => {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day];
    // keep order consistent with ALL_DAYS
    const ordered = ALL_DAYS.filter((d) => next.includes(d));
    onChange(ordered.join(","));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_DAYS.map((day) => {
        const active = selected.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className="px-3 py-2 rounded-xl text-sm font-bold transition-all"
            style={active
              ? { background: "linear-gradient(135deg,#00e87a33,#00d4ff22)", color: "#00e87a", border: "1.5px solid rgba(0,232,122,0.5)", boxShadow: "0 0 8px rgba(0,232,122,0.2)" }
              : { background: "rgba(255,255,255,0.04)", color: "#6b7280", border: "1.5px solid rgba(255,255,255,0.08)" }
            }
          >
            {day}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange(ALL_DAYS.join(","))}
        className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
        style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}
      >
        Every day
      </button>
    </div>
  );
}

export default function PillsManagement() {
  const { data: pills, isLoading } = usePills();
  const { add, update, remove } = usePillMutations();
  const { triggerAlarm } = useAlarmContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPill, setEditingPill] = useState<Pill | null>(null);

  const form = useForm<PillFormData>({
    resolver: zodResolver(pillSchema),
    defaultValues: { name: "", description: "", steps: "", scheduledTime: "08:00", daysOfWeek: "Sun,Mon,Tue,Wed,Thu,Fri,Sat" }
  });

  const openAdd = () => {
    setEditingPill(null);
    form.reset({ name: "", description: "", steps: "", scheduledTime: "08:00", daysOfWeek: "Sun,Mon,Tue,Wed,Thu,Fri,Sat" });
    setIsDialogOpen(true);
  };

  const openEdit = (pill: Pill) => {
    setEditingPill(pill);
    form.reset({
      name: pill.name,
      description: pill.description || "",
      steps: pill.steps || "",
      scheduledTime: pill.scheduledTime,
      daysOfWeek: pill.daysOfWeek || "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: PillFormData) => {
    if (editingPill) {
      update.mutate({ id: editingPill.id, data }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    } else {
      add.mutate({ data }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this medication schedule?")) {
      remove.mutate({ id });
    }
  };

  const formatDays = (daysOfWeek: string) => {
    const days = daysOfWeek.split(",").map((d) => d.trim());
    if (days.length === 7) return "Every day";
    if (days.length === 0) return "No days selected";
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const weekend = ["Sat", "Sun"];
    if (weekdays.every((d) => days.includes(d)) && days.length === 5) return "Weekdays";
    if (weekend.every((d) => days.includes(d)) && days.length === 2) return "Weekends";
    return days.join(", ");
  };

  return (
    <Layout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">Schedule Management</h1>
          <p className="text-muted-foreground mt-2 text-lg">Add, edit, or remove medication reminders.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Add Medication
        </button>
      </header>

      <div className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading schedule...</div>
        ) : !pills || pills.length === 0 ? (
          <div className="p-16 text-center">
            <PillIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl font-medium text-foreground">No medications scheduled.</p>
            <p className="text-muted-foreground mt-2">Click "Add Medication" to create your first schedule.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...pills].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map((pill) => (
              <div key={pill.id} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-secondary/30 transition-colors">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="font-display font-bold text-xl">{pill.scheduledTime}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{pill.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDays(pill.daysOfWeek || "Sun,Mon,Tue,Wed,Thu,Fri,Sat")}</span>
                    </div>
                    {(pill.description || pill.steps) && (
                      <div className="space-y-1 mt-3">
                        {pill.description && <p className="text-muted-foreground text-sm">{pill.description}</p>}
                        {pill.steps && <p className="text-sm font-medium text-primary bg-primary/5 inline-block px-2.5 py-1 rounded-md">{pill.steps}</p>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => triggerAlarm({ pillId: pill.id, pillName: pill.name, scheduledTime: pill.scheduledTime })}
                    className="p-3 rounded-xl bg-secondary text-amber-400 hover:bg-amber-400 hover:text-black transition-colors"
                    title="Test alarm"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEdit(pill)}
                    className="p-3 rounded-xl bg-secondary text-foreground hover:bg-primary hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pill.id)}
                    className="p-3 rounded-xl bg-secondary text-foreground hover:bg-destructive hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="mb-6">
          <DialogTitle>{editingPill ? "Edit Medication" : "Add Medication"}</DialogTitle>
          <p className="text-muted-foreground mt-2">Set up the details for this reminder.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Medication Name</label>
            <input
              {...form.register("name")}
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              placeholder="e.g. Aspirin 500mg"
            />
            {form.formState.errors.name && <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-foreground mb-1.5">Scheduled Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="time"
                  {...form.register("scheduledTime")}
                  className="w-full bg-background border-2 border-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              {form.formState.errors.scheduledTime && <p className="text-destructive text-sm mt-1">{form.formState.errors.scheduledTime.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Days of the Week
            </label>
            <Controller
              name="daysOfWeek"
              control={form.control}
              render={({ field }) => (
                <DayPicker value={field.value} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.daysOfWeek && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.daysOfWeek.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Description (Optional)</label>
            <input
              {...form.register("description")}
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="e.g. For headache"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1.5">Special Instructions (Optional)</label>
            <input
              {...form.register("steps")}
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="e.g. Take with food and a full glass of water"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={add.isPending || update.isPending}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
            >
              {add.isPending || update.isPending ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </Dialog>
    </Layout>
  );
}
