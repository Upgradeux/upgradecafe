import { redirect } from "next/navigation";

export default async function AdminCafeRedirectPage({
  params,
}: {
  params: Promise<{ cafeSlug: string }>;
}) {
  const { cafeSlug } = await params;
  redirect(`/cafe/${cafeSlug}`);
}
