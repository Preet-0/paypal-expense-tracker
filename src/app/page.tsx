
import LiveDashboard from "@/components/LiveDashboard";
import PayPalDashboard from "@/components/PayPalDashboard";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Your existing Dashboard */}
      <LiveDashboard />

      {/* New PayPal Sandbox Analytics */}
      <PayPalDashboard />
    </div>
  );
}
