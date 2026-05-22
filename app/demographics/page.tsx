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

  const gender      = getGenderSplit(rows);
  const bmi         = getBmiHistogram(rows);
  const eligibility = getEligibilitySplit(rows);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="font-mono text-xs text-muted-foreground">/demographics</div>
        <h1 className="text-base font-medium tracking-tight">Lead segments</h1>
        <p className="text-xs text-muted-foreground max-w-3xl pt-1">
          All leads to date, grouped by gender, WHO BMI bucket, and survey eligibility outcome.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>gender</CardTitle>
            <CardDescription>leads by self-reported gender on the survey</CardDescription>
          </CardHeader>
          <CardContent>
            <GenderPie data={gender} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>eligibility</CardTitle>
            <CardDescription>leads (cream) vs booked leads (helvi blue) per band</CardDescription>
          </CardHeader>
          <CardContent>
            <EligibilityBar data={eligibility} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>bmi distribution</CardTitle>
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
