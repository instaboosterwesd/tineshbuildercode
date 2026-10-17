import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, Plus, Clock, CheckCircle2, XCircle, LifeBuoy, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AppShell, PageHeader, RequireAuth, useWallet } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { requestDeposit } from "@/lib/wallet.functions";
import { HackerLoader } from "@/components/effects/HackerLoader";
import { QueryFeedback } from "@/components/QueryFeedback";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "My Wallet — AppForge" },
      { name: "description", content: "Add balance to your wallet and see your payment history." },
      { property: "og:title", content: "My Wallet — AppForge" },
      { property: "og:description", content: "Add balance to your wallet and see your payment history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <PageHeader title="Wallet" subtitle="Add balance and track your payments." />
        <RequireAuth><WalletPage /></RequireAuth>
      </main>
    </AppShell>
  ),
});

const STATUS: Record<string, { label: string; Icon: typeof Clock; cls: string }> = {
  pending: { label: "Under review", Icon: Clock, cls: "text-warning" },
  approved: { label: "Added", Icon: CheckCircle2, cls: "text-success" },
  rejected: { label: "Rejected", Icon: XCircle, cls: "text-destructive" },
};

function WalletPage() {
  const { data, isError, refetch } = useWallet();
  const [open, setOpen] = useState(false);
  if (!data) return <QueryFeedback label="your wallet" failed={isError} retry={() => refetch()} />;
  return (
    <>
      <div className="surface relative overflow-hidden p-6 text-foreground">
        <p className="text-sm opacity-80">Available balance</p>
        <p className="mt-1 font-display text-4xl font-bold text-primary">₹{data.balance}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="hero" onClick={() => setOpen(true)}><Plus className="size-4" /> Add balance</Button>
          {data.support_link && (
            <Button variant="ghost" asChild>
              <a href={data.support_link} target="_blank" rel="noreferrer"><LifeBuoy className="size-4" /> Help</a>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="deposits" className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="deposits" className="flex-1">Deposits</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="deposits" className="space-y-2">
          {data.deposits.length === 0 && <Empty text="No deposits yet." />}
          {data.deposits.map((d) => {
            const s = STATUS[d.status] ?? STATUS["pending"]!;
            return (
              <div key={d.id} className="surface flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">₹{d.amount}</p>
                  <p className="font-mono text-xs text-muted-foreground">UTR {d.utr} · {new Date(d.created_at).toLocaleString()}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium ${s.cls}`}><s.Icon className="size-4" /> {s.label}</span>
              </div>
            );
          })}
        </TabsContent>
        <TabsContent value="history" className="space-y-2">
          {data.transactions.length === 0 && <Empty text="No transactions yet." />}
          {data.transactions.map((t) => <TxRow key={t.id} tx={t} />)}
        </TabsContent>
      </Tabs>
      <DepositDialog open={open} onOpenChange={setOpen} upi={data.upi_id} min={data.min_deposit} />
    </>
  );
}

export function TxRow({ tx }: { tx: { amount: number; note: string; created_at: string } }) {
  const plus = tx.amount > 0;
  return (
    <div className="surface flex items-center gap-3 p-4">
      <span className={`grid size-9 place-items-center rounded-full ${plus ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
        {plus ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.note || (plus ? "Credit" : "Debit")}</p>
        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
      </div>
      <span className={`font-semibold ${plus ? "text-success" : "text-destructive"}`}>{plus ? "+" : "−"}₹{Math.abs(tx.amount)}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function DepositDialog({ open, onOpenChange, upi, min }: { open: boolean; onOpenChange: (o: boolean) => void; upi: string; min: number }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<"amount" | "pay" | "utr">("amount");
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upi)}&pn=AppForge&am=${amount}&cu=INR`;

  function close(o: boolean) {
    onOpenChange(o);
    if (!o) setTimeout(() => { setStep("amount"); setAmount(""); setUtr(""); }, 200);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestDeposit({ data: { amount: Number(amount), utr: utr.trim() } });
      toast.success("Submitted! Your balance will be added after review.");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      close(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add balance</DialogTitle>
          <DialogDescription>
            {step === "amount" && `Enter the amount you want to add (min ₹${min}).`}
            {step === "pay" && "Scan the QR with any UPI app and pay."}
            {step === "utr" && "Enter the UTR / transaction ID from your payment app."}
          </DialogDescription>
        </DialogHeader>
        {!upi ? (
          <p className="text-sm text-muted-foreground">Payments are not available right now. Please contact support.</p>
        ) : step === "amount" ? (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (Number(amount) < min) { toast.error(`Minimum is ₹${min}`); return; } setStep("pay"); }}>
            <Input type="number" inputMode="numeric" min={min} step={1} required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`₹${min}`} className="h-12 text-lg" autoFocus />
            <div className="flex gap-2">
              {[min, 500, 1000].filter((v, i, a) => a.indexOf(v) === i && v >= min).map((v) => (
                <Button key={v} type="button" variant="outline" size="sm" className="flex-1" onClick={() => setAmount(String(v))}>₹{v}</Button>
              ))}
            </div>
            <Button type="submit" variant="hero">Continue</Button>
          </form>
        ) : step === "pay" ? (
          <div className="grid gap-3 text-center">
            <div className="mx-auto rounded-2xl bg-card p-3 ring-1 ring-border">
              <QRCodeSVG value={upiUrl} size={200} bgColor="transparent" fgColor="currentColor" className="text-foreground" />
            </div>
            <p className="font-display text-2xl font-bold">₹{amount}</p>
            <button type="button" onClick={() => { navigator.clipboard.writeText(upi); toast.success("UPI ID copied"); }} className="mx-auto flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
              {upi} <Copy className="size-3.5" />
            </button>
            <a href={upiUrl} className="text-sm font-medium text-primary sm:hidden">Open UPI app</a>
            <Button variant="hero" onClick={() => setStep("utr")}><CheckCircle2 className="size-4" /> I have paid</Button>
          </div>
        ) : (
          <form className="grid gap-3" onSubmit={submit}>
            <div className="space-y-1.5"><Label htmlFor="utr">UTR / Transaction ID</Label><Input id="utr" required value={utr} onChange={(e) => setUtr(e.target.value)} maxLength={64} placeholder="12-digit UTR" autoFocus /></div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("pay")}>Back</Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={loading}>{loading ? <HackerLoader compact label="Submitting payment" /> : "Submit"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
