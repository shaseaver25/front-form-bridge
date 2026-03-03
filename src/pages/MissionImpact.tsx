import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  usePrograms, 
  useOutcomeMetrics, 
  useAllMeasurementsForProgram,
  useProgramBeneficiaries, 
  useProgramGrants 
} from "@/hooks/useMissionImpact";
import { ProgramOverview } from "@/components/mission-impact/ProgramOverview";
import { OutcomesTab } from "@/components/mission-impact/OutcomesTab";
import { BeneficiariesTab } from "@/components/mission-impact/BeneficiariesTab";
import { GrantAlignmentTab } from "@/components/mission-impact/GrantAlignmentTab";
import { ProgramOfferingsTab } from "@/components/programs/ProgramOfferingsTab";
import { AddProgramDialog } from "@/components/mission-impact/AddProgramDialog";
import { Target, Users, TrendingUp, Link2, FolderOpen, Package } from "lucide-react";

export default function MissionImpact() {
  const { data: programs = [], isLoading: programsLoading } = usePrograms();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // Auto-select first program
  const currentProgramId = selectedProgramId || programs[0]?.id || null;
  const currentProgram = programs.find(p => p.id === currentProgramId);

  const { data: metrics = [], isLoading: metricsLoading } = useOutcomeMetrics(currentProgramId);
  const { data: measurements = [] } = useAllMeasurementsForProgram(currentProgramId);
  const { data: beneficiaries = [] } = useProgramBeneficiaries(currentProgramId);
  const { data: linkedGrants = [] } = useProgramGrants(currentProgramId);

  const totalBeneficiaries = beneficiaries.reduce((sum, b) => sum + b.total_served, 0);
  const totalFunding = linkedGrants.reduce((sum, lg) => sum + (lg.funding_amount || 0), 0);

  if (programsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mission Impact</h1>
            <p className="text-muted-foreground">Track program outcomes and beneficiary impact</p>
          </div>
          <div className="flex items-center gap-3">
            {programs.length > 0 && (
              <Select 
                value={currentProgramId || ""} 
                onValueChange={setSelectedProgramId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <AddProgramDialog />
          </div>
        </div>

        {programs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Programs Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first program to start tracking mission impact, outcomes, and beneficiaries.
              </p>
              <AddProgramDialog />
            </CardContent>
          </Card>
        ) : currentProgram ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 max-w-2xl">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="offerings" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Offerings</span>
              </TabsTrigger>
              <TabsTrigger value="outcomes" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Outcomes</span>
              </TabsTrigger>
              <TabsTrigger value="beneficiaries" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Beneficiaries</span>
              </TabsTrigger>
              <TabsTrigger value="grants" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Grants</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {metricsLoading ? (
                <Skeleton className="h-[400px]" />
              ) : (
                <ProgramOverview
                  program={currentProgram}
                  metrics={metrics}
                  measurements={measurements}
                  totalBeneficiaries={totalBeneficiaries}
                  totalFunding={totalFunding}
                />
              )}
            </TabsContent>

            <TabsContent value="offerings">
              <ProgramOfferingsTab programId={currentProgram.id} />
            </TabsContent>

            <TabsContent value="outcomes">
              <OutcomesTab
                programId={currentProgram.id}
                metrics={metrics}
                measurements={measurements}
              />
            </TabsContent>

            <TabsContent value="beneficiaries">
              <BeneficiariesTab
                programId={currentProgram.id}
                beneficiaries={beneficiaries}
              />
            </TabsContent>

            <TabsContent value="grants">
              <GrantAlignmentTab
                programId={currentProgram.id}
                linkedGrants={linkedGrants}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </Layout>
  );
}
