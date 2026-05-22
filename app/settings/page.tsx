import { DashboardPage } from "@/components/ui/dashboard-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TENANT_ID } from "@/lib/tenant";

export default function SettingsPage() {
  return (
    <DashboardPage title="Settings">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Tenant</dt>
            <dd className="num font-medium">{TENANT_ID}</dd>
            <dt className="text-muted-foreground">Timezone</dt>
            <dd className="num font-medium">UTC</dd>
          </dl>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
