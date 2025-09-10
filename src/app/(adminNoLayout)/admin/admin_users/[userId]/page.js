import UserDetailPage from "@/components/admin/admin_user/UserDetailPage";

export default function UserPage({ params }) {
  return <UserDetailPage userId={params.userId} />;
}
