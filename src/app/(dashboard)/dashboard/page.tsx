import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus, ArrowRight, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) return null;

  const [accountCount] = await db
    .select({ count: count() })
    .from(schema.mailAccounts)
    .where(eq(schema.mailAccounts.userId, session.user.id));

  const accounts = await db
    .select()
    .from(schema.mailAccounts)
    .where(eq(schema.mailAccounts.userId, session.user.id))
    .limit(5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your mail accounts.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mail Accounts</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountCount.count}</div>
            <p className="text-xs text-muted-foreground">
              Connected email accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/accounts/new">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Mail Accounts</CardTitle>
          <CardDescription>
            Click on an account to open webmail
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No mail accounts configured yet
              </p>
              <Link href="/accounts/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.email}
                      </p>
                    </div>
                  </div>
                  <Link href={`/webmail/${account.id}`}>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}

              {accountCount.count > 5 && (
                <Link href="/accounts" className="block">
                  <Button variant="outline" className="w-full">
                    View All Accounts
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
