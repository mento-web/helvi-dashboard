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
  getDemographicsForRange,
  getEligibilitySplit,
  getGenderSplit,
} from "@/lib/queries/demographics";
import { MultiParamControl } from "@/components/ui/dashboard-slice-controls";
import { parseDateRangeParams } from "@/lib/date-range";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DemographicsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const range = parseDateRangeParams(sp, 30);
  const selectedGender = parseMultiParam(sp.gender);
  const selectedEligibility = parseMultiParam(sp.eligibility);
  const rows = await getDemographicsForRange({
    range,
    gender: selectedGender,
    eligibility: selectedEligibility,
  });

  const gender      = getGenderSplit(rows);
  const bmi         = getBmiHistogram(rows);
  const eligibility = getEligibilitySplit(rows);

  return (
    <DashboardPage
      title="Demographics"
      dateRange={range}
      customize={
        <div className="grid gap-4">
          <MultiParamControl
            label="Gender"
            param="gender"
            selected={selectedGender}
            options={[
              { value: "women", label: "Women" },
              { value: "men", label: "Men" },
            ]}
          />
          <MultiParamControl
            label="Eligibility"
            param="eligibility"
            selected={selectedEligibility}
            options={[
              { value: "eligible", label: "Eligible" },
              { value: "borderline", label: "Borderline" },
              { value: "low-bmi", label: "Low BMI" },
            ]}
          />
        </div>
      }
    >
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
          <PeriodFooter current={range.label} />
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
          <PeriodFooter current={range.label} />
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
        <PeriodFooter current={range.label} />
      </Card>
    </DashboardPage>
  );
}

function parseMultiParam(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}
