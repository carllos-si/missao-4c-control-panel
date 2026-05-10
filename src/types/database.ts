export type Participant = {
  id: string;
  name: string;
  observations: string;
};

export type ApplicationRecord = {
  id: string;
  user_id: string;
  company_name: string;
  applied_at: string;
  participant_count: number;
  participants: Participant[];
  ai_report: string | null;
  created_at: string;
  updated_at: string;
};
