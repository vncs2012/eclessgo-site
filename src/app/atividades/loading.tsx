import { getLocale } from "next-intl/server";
import { PublicActivityLoadingView } from "../../components/site/church-public-activities";

export default async function PublicActivitiesLoading() {
  return <PublicActivityLoadingView locale={await getLocale()} />;
}
