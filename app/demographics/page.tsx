/* ============================================================================
   app/demographics/page.tsx — Lead demographics.

   Three side-by-side cards backed by the demographics_summary view:
     - Gender split (pie)
     - BMI distribution (histogram)
     - Eligibility outcome with booking overlay (paired bar)
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription, ExploreButton, PeriodFooter } from "@/components/ui/card";
import { DashboardPage } from "@/components/ui/dashboard-page";
import { BmiHistogram } from "@/components/charts/bmi-histogram";
import { EligibilityBar } from "@/components/charts/eligibility-bar";
import { GenderPie } from "@/components/charts/gender-pie";
import {
  getBmiHistogram,
  getDemographics,
  getEligibilitySplit,
  getGenderSplit,
} from "@/lib/queries/demographics";

export default async function DemographicsPage() {
  const rows = await getDemographics();

  const gender      = getGenderSplit(rows);
  const bmi         = getBmiHistogram(rows);
  const eligibility = getEligibilitySplit(rows);

  return (
    <DashboardPage title="Demographics" period="All time">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Leads by gender</CardTitle>
              <CardDescription>Self-reported gender from the survey.</CardDescription>
            </div>
            <ExploreButton label="Leads by gender" />
          </CardHeader>
          <CardContent>
            <GenderPie data={gender} />
          </CardContent>
          <PeriodFooter current="All time" />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Eligibility by booking status</CardTitle>
              <CardDescription>Leads and confirmed bookings per eligibility outcome.</CardDescription>
            </div>
            <ExploreButton label="Eligibility by booking status" />
          </CardHeader>
          <CardContent>
            <EligibilityBar data={eligibility} />
          </CardContent>
          <PeriodFooter current="All time" />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>BMI distribution</CardTitle>
            <CardDescription>WHO categories, including leads without a recorded BMI.</CardDescription>
          </div>
          <ExploreButton label="BMI distribution" />
        </CardHeader>
        <CardContent>
          <BmiHistogram data={bmi} />
        </CardContent>
        <PeriodFooter current="All time" />
      </Card>
    </DashboardPage>
  );
}
