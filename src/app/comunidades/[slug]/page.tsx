import type { Metadata } from "next";

import ChurchDetailPage, {
  generateMetadata as generateChurchMetadata,
  generateStaticParams as generateChurchStaticParams,
} from "../../igrejas/[slug]/page";

export const revalidate = 300;
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return generateChurchMetadata(props);
}

export async function generateStaticParams() {
  return generateChurchStaticParams();
}

export default async function CommunityDetailPage(props: PageProps) {
  return <ChurchDetailPage {...props} />;
}
