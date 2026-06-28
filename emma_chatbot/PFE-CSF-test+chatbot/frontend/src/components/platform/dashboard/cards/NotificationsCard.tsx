'use client';

import { AlertCircle, Clock, BookOpen, Calendar } from 'lucide-react';

interface Notification {
  id: string;
  icon: 'alert' | 'clock' | 'book' | 'calendar';
  title: string;
  description: string;
  time: string;
}

interface NotificationsCardProps {
  notifications?: Notification[];
}

const defaultNotifications: Notification[] = [
  {
    id: '1',
    icon: 'calendar',
    title: "Changement d'horaire",
    description: "La classe 'Leadership Agile' est décalée au 22 oct. à 14h00.",
    time: 'Il y a 2 heures',
  },
  {
    id: '2',
    icon: 'clock',
    title: 'Rappel de lab',
    description: "N'oubliez pas de soumettre le livrable du Lab Docker avant ce soir.",
    time: "Aujourd'hui, 09:00",
  },
  {
    id: '3',
    icon: 'book',
    title: 'Nouveau support disponible',
    description: "Les cours de la séance « Analyse prédictive » ont été ajoutés à vos ressources.",
    time: 'Hier',
  },
];

export default function NotificationsCard({ notifications = defaultNotifications }: NotificationsCardProps) {
  const getIcon = (type: string) => {
    const iconClass = 'shrink-0 text-[#1a3d5d]';
    switch (type) {
      case 'alert':
        return <AlertCircle size={18} className={iconClass} />;
      case 'clock':
        return <Clock size={18} className={iconClass} />;
      case 'calendar':
        return <Calendar size={18} className={iconClass} />;
      case 'book':
        return <BookOpen size={18} className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:min-h-[420px]">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1a2a3a]">Notifications (Planning)</h3>
        <span className="shrink-0 rounded-full bg-[#4caf50] px-2.5 py-0.5 text-[11px] font-bold text-white">
          2 Nouvelles
        </span>
      </div>

      <div className="space-y-0 divide-y divide-[#f3f4f6]">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex gap-3 py-4 first:pt-0">
            <div className="mt-0.5">{getIcon(notification.icon)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1a2a3a]">{notification.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.description}</p>
              <p className="mt-1.5 text-xs text-muted-foreground/90">{notification.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
