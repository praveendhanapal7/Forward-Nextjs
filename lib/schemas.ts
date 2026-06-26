import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

export const RegisterSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phoneNumber: z.string().min(10).max(20),
  location: z.string().min(1).max(120),
  accountType: z.enum(["client", "staff", "agency"]),
  brandName: z.string().max(120).optional().nullable(),
  password: z.string().min(8).max(128),
  secretKey: z.string().min(1).max(128),
});

export const LeadSchema = z.object({
  phoneNumber: z.string().max(20).optional().nullable(),
  requirements: z.string().max(500).optional().nullable(),
  clientName: z.string().max(120).optional().nullable(),
  enquiryEntry: z.string().max(120).optional().nullable(),
  addedBy: z.string().max(120).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  link: z.string().url().max(512).optional().nullable(),
});

export const StatusSchema = z.object({
  status: z.string().min(1).max(50),
});

export const NotesSchema = z.object({
  id: z.number().int().positive(),
  notes: z.string().max(2000),
});

export const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  message: z.string().min(1).max(2000),
});
