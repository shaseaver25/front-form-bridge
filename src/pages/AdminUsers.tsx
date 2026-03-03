import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, MoreVertical, Mail, Key, KeyRound, Ban, Trash2, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SetPasswordDialog } from "@/components/admin/SetPasswordDialog";

interface UserWithRole {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  organization_name: string | null;
  is_active: boolean;
  role: string | null;
  status: "active" | "inactive" | "pending";
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  async function loadUsers() {
    try {
      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Map profiles to users with roles
      const usersWithRoles: UserWithRole[] = profiles?.map((profile: any) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        
        let status: "active" | "inactive" | "pending" = "active";
        if (!profile.is_active) {
          status = "inactive";
        }

        return {
          id: profile.id,
          email: profile.email || "",
          first_name: profile.first_name,
          last_name: profile.last_name,
          job_title: profile.job_title,
          organization_name: profile.organization_name,
          is_active: profile.is_active,
          role: userRole?.role || null,
          status,
        };
      }) || [];

      // Get pending invitations
      const { data: invitations } = await supabase
        .from("user_invitations")
        .select("*")
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString());

      const pendingUsers: UserWithRole[] =
        invitations?.map((inv) => ({
          id: inv.id,
          email: inv.email,
          first_name: inv.first_name,
          last_name: inv.last_name,
          job_title: inv.job_title,
          organization_name: inv.organization_name,
          is_active: false,
          role: inv.role,
          status: "pending" as const,
        })) || [];

      setUsers([...usersWithRoles, ...pendingUsers]);
      setFilteredUsers([...usersWithRoles, ...pendingUsers]);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
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

  function getStatusIcon(status: string) {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <Ban className="h-4 w-4 text-gray-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  }

  async function handleSendPasswordReset(userId: string, email: string) {
    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { 
          email, 
          redirectUrl: window.location.origin 
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Sent",
        description: `A password reset link has been sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    }
  }

  async function handleResendInvitation(user: UserWithRole) {
    try {
      // Get the invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError || !invitation) {
        throw new Error("Invitation not found");
      }

      // Call the send-user-invitation edge function to resend
      const { data, error } = await supabase.functions.invoke("send-user-invitation", {
        body: {
          email: invitation.email,
          firstName: invitation.first_name,
          lastName: invitation.last_name,
          role: invitation.role,
          phone: invitation.phone,
          jobTitle: invitation.job_title,
          department: invitation.department,
          organizationName: invitation.organization_name,
        },
      });

      if (error) throw error;

      // Delete the old invitation since a new one was created
      await supabase
        .from("user_invitations")
        .delete()
        .eq("id", user.id);

      toast({
        title: "Invitation Resent",
        description: `A new invitation has been sent to ${user.email}`,
      });

      // Reload users to get the new invitation
      loadUsers();
    } catch (error: unknown) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend invitation.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteUser(user: UserWithRole) {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      if (user.status === "pending") {
        // Delete pending invitation
        const { error } = await supabase
          .from("user_invitations")
          .delete()
          .eq("id", user.id);

        if (error) throw error;
      } else {
        // Delete user role first (due to foreign key constraints)
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id);

        // Set user as inactive (soft delete) or delete profile
        const { error } = await supabase
          .from("user_profiles")
          .delete()
          .eq("id", user.id);

        if (error) throw error;
      }

      toast({
        title: "User Deleted",
        description: `${user.first_name} ${user.last_name} has been removed.`,
      });

      // Refresh the user list
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage CRM users and their permissions</p>
        </div>
        <Button onClick={() => navigate("/admin/users/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        {user.job_title && (
                          <div className="text-sm text-muted-foreground">{user.job_title}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.organization_name && (
                      <span className="text-sm text-muted-foreground">{user.organization_name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role && (
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.status)}
                      <span className="text-sm capitalize">{user.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status !== "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                              Edit User
                            </DropdownMenuItem>
                          </>
                        )}
                        {user.status !== "pending" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleSendPasswordReset(user.id, user.email)}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Send Password Reset
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setPasswordDialogOpen(true);
                              }}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Set Temporary Password
                            </DropdownMenuItem>
                          </>
                        )}
                        {user.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleResendInvitation(user)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Invitation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </Card>

      {selectedUser && (
        <SetPasswordDialog
          open={passwordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          userName={`${selectedUser.first_name} ${selectedUser.last_name}`}
        />
      )}
      </div>
    </Layout>
  );
}