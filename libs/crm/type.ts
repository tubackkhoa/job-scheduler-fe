export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: {
    name: string;
  };
}

export interface Deal {
  id: number;
  title: string;
  value: number;
  stage: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  source: string;
  status: string;
}
