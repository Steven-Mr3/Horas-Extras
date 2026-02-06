import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft dark:shadow-md border border-slate-200 dark:border-card-border flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      
      <div className="relative h-16 w-16 mb-4 group-hover:scale-110 transition-transform duration-300">
        <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(0,224,255,0.2)] bg-primary/10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary drop-shadow-[0_0_5px_rgba(0,224,255,0.8)]" />
        </div>
      </div>
      
      <div className="flex flex-col items-center relative z-10">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</span>
        <span className="text-2xl font-bold text-slate-800 dark:text-white">{value}</span>
      </div>
    </div>
  );
};