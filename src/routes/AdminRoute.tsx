import { Router, Routes, Route } from "react-router-dom";
import { Admin } from "@/pages/Admin";
import { useAuth } from "@/contexts/AuthContext";

// Add admin route to your app router
<Route 
  path="/admin" 
  element={<Admin />} 
/>

// Or if using component-based routing, add this to your component
export { Admin };