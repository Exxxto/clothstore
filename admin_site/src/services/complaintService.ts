import { AppError } from "../lib/AppError";
import * as repo from "../repositories/complaintRepository";

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function listComplaints(filters: {
  limit?: number;
  status?: string;
  search?: string;
}) {
  return repo.findAllComplaints(filters);
}

export async function getComplaint(id: number) {
  const complaint = await repo.findComplaintById(id);
  if (!complaint) throw new AppError("Жалоба не найдена", 404);
  return complaint;
}

export async function createComplaint(body: {
  requester_name: string;
  email: string;
  phone?: string | null;
  order_number?: string | null;
  category: string;
  message: string;
}) {
  return repo.createComplaint({
    requester_name: trim(body.requester_name),
    email: trim(body.email),
    phone: trim(body.phone) || null,
    order_number: trim(body.order_number) || null,
    category: trim(body.category),
    message: trim(body.message),
  });
}

export async function changeComplaintStatus(id: number, status: string) {
  const complaint = await repo.updateComplaintStatus(id, status);
  if (!complaint) throw new AppError("Жалоба не найдена", 404);
  return complaint;
}
