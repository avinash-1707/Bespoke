"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCreateOffering } from "@/lib/hooks/use-offerings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { InlineExplainer } from "@/components/shared/inline-explainer";

interface OfferingCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The deeper structured fields, revealed under "Add more detail". */
const DETAIL_FIELDS = [
  {
    key: "targetAudience",
    label: "Target audience",
    placeholder: "Who you sell to (e.g. mid-market sales teams)",
  },
  {
    key: "problemSolved",
    label: "Problem solved",
    placeholder: "The specific pain you remove for them",
  },
  {
    key: "uniqueValueProp",
    label: "What makes you different",
    placeholder: "Why you over the alternatives",
  },
  {
    key: "proofPoints",
    label: "Proof points",
    placeholder: "Results, customers, numbers that build trust",
  },
] as const;

type DetailKey = (typeof DETAIL_FIELDS)[number]["key"];

/**
 * Offering creation. Name + URL + description stay visible for the fast
 * scrape-or-quick-capture path; the four deeper structured fields (audience,
 * problem, value prop, proof points) live under a collapsible "Add more detail"
 * section so manual users can build a rich offering up front. Every field maps
 * to a column the generation context reads, mirroring the detail page. The full
 * offering remains editable later regardless.
 */
export function OfferingCreateDialog({
  open,
  onOpenChange,
}: OfferingCreateDialogProps) {
  const create = useCreateOffering();
  const [name, setName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState<Record<DetailKey, string>>({
    targetAudience: "",
    problemSolved: "",
    uniqueValueProp: "",
    proofPoints: "",
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSourceUrl("");
    setDescription("");
    setDetails({
      targetAudience: "",
      problemSolved: "",
      uniqueValueProp: "",
      proofPoints: "",
    });
    setExpanded(false);
  }, [open]);

  function setDetail(key: DetailKey, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (!name.trim()) return;
    // Optimistic create + close immediately; the hook handles rollback/toast.
    create.mutate({
      name: name.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      description: description.trim() || undefined,
      targetAudience: details.targetAudience.trim() || undefined,
      problemSolved: details.problemSolved.trim() || undefined,
      uniqueValueProp: details.uniqueValueProp.trim() || undefined,
      proofPoints: details.proofPoints.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New offering</DialogTitle>
          <DialogDescription>
            Describe what you are selling. Add a URL to scrape its details
            automatically, or fill in the fields yourself. You can combine both.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="offering-name">Name</Label>
            <Input
              id="offering-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme analytics platform"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="offering-url">URL to scrape (optional)</Label>
            <Input
              id="offering-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="offering-description">Description</Label>
              <InlineExplainer
                topic="offering"
                staticCopy="Your offering is the core value you bring to a prospect. It is what makes your outreach relevant to them specifically: what you do, who you sell to, the problem you solve, and what makes you different. The better your offering is defined, the better every message will be."
                getDraft={() => description}
              />
            </div>
            <Textarea
              id="offering-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What it is and who it is for…"
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-fit items-center gap-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              aria-expanded={expanded}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform motion-reduce:transition-none",
                  expanded && "rotate-90",
                )}
              />
              Add more detail (optional)
            </button>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 pt-4">
                    {DETAIL_FIELDS.map(({ key, label, placeholder }) => (
                      <div key={key} className="flex flex-col gap-2">
                        <Label htmlFor={`offering-${key}`}>{label}</Label>
                        <Textarea
                          id={`offering-${key}`}
                          value={details[key]}
                          onChange={(e) => setDetail(key, e.target.value)}
                          placeholder={placeholder}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || !name.trim()}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
