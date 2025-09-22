"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Menu, Bell, Settings } from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
};

type AppShellProps = {
  title: string;
  subtitle?: string;
  alertsCount?: number;
  navItems: NavItem[];
  rightActions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, alertsCount = 0, navItems, rightActions, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile nav trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-sm">
                <DialogHeader className="px-4 pt-4">
                  <DialogTitle>Navegar</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.active;
                    return (
                      <Button
                        key={item.id}
                        variant={active ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={item.onClick}
                      >
                        {Icon && <Icon className="w-4 h-4 mr-2" />}
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold truncate">{title}</h1>
                {alertsCount > 0 && (
                  <Badge variant="destructive" className="hidden sm:flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
                    {alertsCount}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <Input placeholder="Buscar..." className="w-56" />
            </div>
            <Button variant="ghost" size="icon"><Bell className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
            {rightActions}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="hidden sm:block col-span-3">
          <Card className="p-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.active;
                return (
                  <Button
                    key={item.id}
                    variant={active ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={item.onClick}
                  >
                    {Icon && <Icon className="w-4 h-4 mr-2" />}
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* Main content */}
        <main className="col-span-12 sm:col-span-9">
          <Card className="p-4 sm:p-6">
            {children}
          </Card>
          <Separator className="my-6 opacity-0" />
        </main>
      </div>
    </div>
  );
}
