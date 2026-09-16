import { redirect } from "next/navigation";

export default function OrdersHistoryPage() {
  redirect("/menu?tab=orders");
}
