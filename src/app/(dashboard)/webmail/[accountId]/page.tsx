import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { AccountService } from "@/lib/services/account-service";
import { InboxView } from "@/components/mail/inbox-view";

interface WebmailPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function WebmailPage({ params }: WebmailPageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { accountId } = await params;

  const account = await AccountService.getAccount(session.user.id, accountId);
  if (!account) notFound();

  return (
    <div className="h-full">
      <InboxView
        accountId={account.id}
        accountName={account.name}
        accountEmail={account.email}
      />
    </div>
  );
}
