import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import PillsManagement from "@/pages/pills-management";
import Settings from "@/pages/settings";
import QrCodePage from "@/pages/qr-code";
import { AlarmProvider } from "@/context/alarm-context";
import { AlarmOverlay } from "@/components/alarm-overlay";
import { GuardianCallModal } from "@/components/guardian-call-modal";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pills" component={PillsManagement} />
      <Route path="/settings" component={Settings} />
      <Route path="/qr" component={QrCodePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AlarmProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <AlarmOverlay />
          <GuardianCallModal />
          <Toaster />
        </AlarmProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
