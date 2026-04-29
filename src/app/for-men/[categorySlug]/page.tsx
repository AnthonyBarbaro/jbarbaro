import { redirect } from "next/navigation";

export default async function ForMenCategoryRedirectPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;

  redirect(`/categories/${categorySlug}`);
}
