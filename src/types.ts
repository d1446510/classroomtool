export interface Student {
  id: string;
  name: string;
  seatNumber?: string;
}

export interface DrawHistoryItem {
  id: string;
  student: Student;
  timestamp: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  colorTheme: {
    bg: string;
    border: string;
    badge: string;
    header: string;
    text: string;
  };
  members: Student[];
}

export type ActiveTab = 'lottery' | 'groups' | 'roster';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0 to 1
}
