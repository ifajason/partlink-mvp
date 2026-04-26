import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SellerProvider } from "./contexts/SellerContext";
import Login from "./pages/Login";
import LineCallback from "./pages/LineCallback";
import Dashboard from "./pages/Dashboard";
import AddPart from "./pages/AddPart";
import EditPart from "./pages/EditPart";
import Inquiries from "./pages/Inquiries";
import InquiryForm from "./pages/InquiryForm";
import Account from "./pages/Account";
import Privacy from "./pages/Privacy";
import BuyerLogin from "./pages/BuyerLogin";
import PricingPlans from "./pages/PricingPlans";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Login} />
      <Route path={"/login"} component={Login} />
      <Route path={"/auth/line/callback"} component={LineCallback} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/add-part"} component={AddPart} />
      <Route path={"/edit-part"} component={EditPart} />
      <Route path={"/inquiries"} component={Inquiries} />
      <Route path={"/inquiry/:partId"} component={InquiryForm} />
      <Route path={"/inquiry-status/:inquiryId"} component={BuyerLogin} />
      <Route path={"/buyer-login"} component={BuyerLogin} />
      <Route path={"/account"} component={Account} />
      <Route path={"/pricing"} component={PricingPlans} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SellerProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SellerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
