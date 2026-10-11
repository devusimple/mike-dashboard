import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ManageClient from "./manage-client";

export default function ManageProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-64 w-full max-w-3xl" />
        </div>
      }
    >
      <ManageClient params={params} />
    </Suspense>
  );
}
