import AdminSection from "../section";
export default async function AdminDynamic({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; return <AdminSection section={section} />; }
