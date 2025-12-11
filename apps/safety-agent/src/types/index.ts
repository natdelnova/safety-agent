export interface SafetyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
  created_at: string;
}

export interface ScheduledCall {
  id: string;
  user_id: string;
  scheduled_time: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}
