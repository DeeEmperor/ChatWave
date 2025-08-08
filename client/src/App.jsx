import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "@/components/NotificationContainer";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found.jsx";
import Home from "@/pages/home.jsx";
import ModernHome from "@/pages/modern-home.jsx";
import "./styles/app.css";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ModernHome} />
      <Route path="/classic" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="cw-app">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NotificationProvider>
            <Router />
          </NotificationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
