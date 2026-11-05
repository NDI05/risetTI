import type { Request } from "express";

export type UserRole = "mahasiswa" | "admin";

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthContext {
  user: PublicUser;
  tokenHash: string;
  csrfToken: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export interface ReferenceInput {
  title: string;
  authors: string;
  year: number;
  institution: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  domain: string;
  methods: string[];
  technologies: string[];
  isDemo: boolean;
  externalId?: string | null;
  doi?: string | null;
  license?: string | null;
  language?: string | null;
}

export interface Worksheet {
  title: string;
  problem: string;
  context: string;
  dataSources: string;
  method: string;
  technologies: string;
  technicalNeeds: string;
  timeResources: string;
  risksValidation: string;
}

export interface IdeaAnswer {
  question: string;
  answer: string;
}

export interface IdeaIntake {
  title: string;
  answers: IdeaAnswer[];
}

export type AppRequest = Request & { auth?: AuthContext };
