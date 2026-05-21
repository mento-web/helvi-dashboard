/* ============================================================================
   app/demographics/page.tsx — Lead demographics.

   Three side-by-side cards backed by the demographics_summary view:
     - Gender split (pie)
     - BMI distribution (histogram)
     - Eligibility outcome with booking overlay (paired bar)
   ========================================================================== */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  // All three reshapes work off the same demographics_summary fetch.
  const gender      = getGenderSplit(rows);
  const bmi         = getBmiHistogram(rows);
  const eligibility = getEligibilitySplit(rows);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-editorial text-4xl tracking-tight">Demographics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          All leads to date, grouped by gender, WHO BMI bucket, and survey eligibility outcome.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gender split</CardTitle>
            <CardDescription>Leads by self-reported gender on the survey.</CardDescription>
          </CardHeader>
          <CardContent>
            <GenderPie data={gender} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eligibility outcome</CardTitle>
            <CardDescription>
              Leads (cream) vs booked leads (Helvi blue) per eligibility band.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EligibilityBar data={eligibility} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BMI distribution</CardTitle>
          <CardDescription>
            WHO categories from underweight to obese class III. Includes leads without a recorded
            BMI in the &quot;Unknown&quot; bucket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BmiHistogram data={bmi} />
        </CardContent>
      </Card>
    </div>
  );
}
