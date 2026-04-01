export interface Agent {
  name: string;
  pitch: string;
  skills: string[];
  active: boolean;
  insights?: string[];
  lastActive?: string;
}

export interface Founder {
  readonly name: string;
  readonly url: string;
}

export interface SocialLink {
  readonly url: string;
  readonly handle: string;
}
