import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Award, ExternalLink, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface LMSStudentSectionProps {
  constituentId: string;
}

export function LMSStudentSection({ constituentId }: LMSStudentSectionProps) {
  const { data: lmsStudent } = useQuery({
    queryKey: ["lms-student", constituentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_students")
        .select(`
          *,
          lms_config:lms_configurations(lms_name, lms_type)
        `)
        .eq("constituent_id", constituentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ["lms-enrollments", constituentId],
    queryFn: async () => {
      if (!lmsStudent?.id) return [];

      const { data, error } = await supabase
        .from("lms_enrollments")
        .select(`
          *,
          course:lms_courses(course_name, course_code, lms_config:lms_configurations(lms_name))
        `)
        .eq("lms_student_id", lmsStudent.id)
        .order("enrollment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!lmsStudent?.id,
  });

  const activeEnrollments = enrollments?.filter((e) => e.status === "active" || e.status === "enrolled") || [];
  const completedEnrollments = enrollments?.filter((e) => e.status === "completed") || [];
  const certificates = completedEnrollments.filter((e) => e.certificate_url);

  if (!lmsStudent) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "active":
      case "enrolled":
        return "secondary";
      case "dropped":
      case "withdrawn":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>
                  {lmsStudent.lms_config?.lms_name || "Learning Management System"}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary">Student ID: {lmsStudent.lms_student_id}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{activeEnrollments.length}</div>
              <div className="text-sm text-muted-foreground">Active Courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{completedEnrollments.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{certificates.length}</div>
              <div className="text-sm text-muted-foreground">Certificates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Enrollments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {activeEnrollments.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>LMS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{enrollment.course?.course_name}</div>
                          {enrollment.course?.course_code && (
                            <div className="text-sm text-muted-foreground">
                              {enrollment.course.course_code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {enrollment.course?.lms_config?.lms_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {enrollment.score_percentage && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${enrollment.score_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {enrollment.score_percentage}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.grade && (
                          <Badge variant="secondary">{enrollment.grade}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(enrollment.enrollment_date), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active enrollments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedEnrollments.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.course?.course_name}
                      </TableCell>
                      <TableCell>
                        {enrollment.grade && (
                          <Badge variant="default">{enrollment.grade}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.score_percentage && (
                          <span className="font-medium">{enrollment.score_percentage}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {enrollment.completion_date &&
                          format(new Date(enrollment.completion_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {enrollment.certificate_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={enrollment.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Award className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed courses yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {certificates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {certificates.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="h-8 w-8 text-primary" />
                        <div>
                          <CardTitle className="text-lg">
                            {enrollment.course?.course_name}
                          </CardTitle>
                          <CardDescription>
                            Completed{" "}
                            {enrollment.completion_date &&
                              format(new Date(enrollment.completion_date), "MMMM yyyy")}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        {enrollment.grade && (
                          <Badge variant="default" className="mb-2">
                            Grade: {enrollment.grade}
                          </Badge>
                        )}
                        {enrollment.score_percentage && (
                          <div className="text-sm text-muted-foreground">
                            Score: {enrollment.score_percentage}%
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={enrollment.certificate_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No certificates earned yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
