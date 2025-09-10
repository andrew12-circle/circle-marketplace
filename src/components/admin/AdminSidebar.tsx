import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Users,
  Upload,
  BarChart3,
  Star,
  Building,
  Coins,
  TrendingUp,
  Eye,
  Lock,
  Youtube,
  Send,
  Shield,
  Heart,
  DollarSign,
  Globe,
  Calendar,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

const navigationGroups = [
  {
    label: 'Dashboard',
    items: [
      { title: 'Overview', url: '/admin/overview', icon: Activity },
      { title: 'System Health', url: '/admin/health', icon: Activity },
    ]
  },
  {
    label: 'User Management',
    items: [
      { title: 'Users', url: '/admin/users', icon: Users },
      { title: 'Agent Invites', url: '/admin/agent-invites', icon: Send },
    ]
  },
  {
    label: 'Content & Services',
    items: [
      { title: 'Content', url: '/admin/content', icon: Upload },
      { title: 'Services', url: '/admin/services', icon: BarChart3 },
      { title: 'Reviews', url: '/admin/reviews', icon: Star },
    ]
  },
  {
    label: 'Vendor Management',
    items: [
      { title: 'Vendors', url: '/admin/vendors', icon: Building },
      { title: 'Points', url: '/admin/points', icon: Coins },
      { title: 'Sponsored', url: '/admin/sponsored', icon: Eye },
    ]
  },
  {
    label: 'Analytics & Performance',
    items: [
      { title: 'Analytics', url: '/admin/analytics', icon: TrendingUp },
      { title: 'Website Analytics', url: '/admin/website-analytics', icon: Eye },
      { title: 'Ranking', url: '/admin/ranking', icon: BarChart3 },
      { title: 'Retention', url: '/admin/retention', icon: TrendingUp },
    ]
  },
  {
    label: 'Compliance & Security',
    items: [
      { title: 'RESPA', url: '/admin/respa', icon: Shield },
      { title: 'Security', url: '/admin/security', icon: Lock },
    ]
  },
  {
    label: 'External Integrations',
    items: [
      { title: 'YouTube', url: '/admin/youtube', icon: Youtube },
      { title: 'Affiliates', url: '/admin/affiliates', icon: Globe },
    ]
  },
  {
    label: 'Financial & Business',
    items: [
      { title: 'Commissions', url: '/admin/commissions', icon: DollarSign },
      { title: 'Calculator', url: '/admin/calculator', icon: BarChart3 },
      { title: 'Bookings', url: '/admin/bookings', icon: Calendar },
    ]
  },
  {
    label: 'Specialized',
    items: [
      { title: 'Spiritual', url: '/admin/spiritual', icon: Heart },
      { title: 'Settings', url: '/admin/settings', icon: Settings },
    ]
  }
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, profile, signOut } = useAuth();

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Sidebar className="w-60">
      <SidebarContent>
        {/* User Profile Section */}
        <SidebarGroup>
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.display_name || user?.email?.split('@')[0] || 'Admin User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Administrator
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SidebarGroup>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium flex items-center gap-2 px-2 py-1.5 text-sm rounded-md'
                            : 'hover:bg-accent/50 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md'
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}