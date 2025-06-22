import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { Footer } from "~/components/footer";
import { SiteHeader } from "~/components/header";
import { categoryManager } from "~/models/category.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const categories = await categoryManager.getCategoriesTree();

  return { categories: categories };
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
