-- Insert admin role for shannon@tailoredu.org (user_id: a85f6843-fdce-4043-a5ab-990431b21980)
INSERT INTO public.user_roles (user_id, role)
VALUES ('a85f6843-fdce-4043-a5ab-990431b21980', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
