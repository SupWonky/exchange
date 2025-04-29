import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { CategoryMenu } from "~/components/category-menu";
import { Footer } from "~/components/footer";
import { SiteHeader } from "~/components/header";
import { getCategoriesTree } from "~/models/category.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const categories = await getCategoriesTree();

  return { categories };
};

export default function DefaultLayout() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <>
      <SiteHeader categories={categories} />
      <div className="flex-1 mb-12 mt-6">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
