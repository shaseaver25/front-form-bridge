import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Users, ShieldCheck, ShieldAlert, FolderKanban } from "lucide-react";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
}

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access to all features", icon: ShieldAlert },
  { value: "staff", label: "Staff", description: "Standard access to CRM features", icon: ShieldCheck },
  { value: "viewer", label: "Viewer", description: "Read-only access", icon: Shield },
  { value: "project", label: "Project", description: "Access to assigned projects only", icon: FolderKanban },
];

export default function AdminRoles() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsersWithRoles();
  }, []);

  async function loadUsersWithRoles() {
    try {
      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email")
        .eq("is_active", true)
        .order("first_name", { ascending: true });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile: any) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          role: userRole?.role || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    // Find the user's current role
    const currentUser = users.find((u) => u.id === userId);
    const currentRole = currentUser?.role || "__none__";
    
    // Don't do anything if role hasn't changed
    if (newRole === currentRole) {
      return;
    }
    
    setUpdating(userId);
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (newRole === "__none__") {
        // Remove role
        if (existingRole) {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId);
          if (error) throw error;
        }
      } else if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as "admin" | "staff" | "viewer" | "project" })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole as "admin" | "staff" | "viewer" | "project" }]);
        if (error) throw error;
      }

      // Update local state instead of refetching
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole === "__none__" ? null : newRole } : u
        )
      );
      toast.success("Role updated successfully");
    } catch (error: unknown) {
      console.error("Error updating role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  function getRoleBadgeVariant(role: string | null): "default" | "secondary" | "outline" {
    switch (role) {
      case "admin":
        return "default";
      case "staff":
        return "secondary";
      case "project":
        return "outline";
      default:
        return "outline";
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and access levels</p>
        </div>

        {/* Role Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const count = users.filter((u) => u.role === role.value).length;
            return (
              <Card key={role.value}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.label}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{count} user{count !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Assign roles to control what users can access</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No role</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || "__none__"}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No Role</SelectItem>
                            {ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
