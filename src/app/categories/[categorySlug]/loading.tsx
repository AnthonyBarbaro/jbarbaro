import { Container } from "@/components/ui/Container";

export default function CategoryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading category products">
      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-12 w-full max-w-sm rounded bg-ink/10" />
            <div className="mt-3 h-4 w-full max-w-2xl rounded bg-ink/10" />
            <div className="mt-2 h-4 w-2/3 max-w-xl rounded bg-ink/10" />
          </div>
        </Container>
      </section>

      <section className="bg-stone/45 py-6 sm:py-8 lg:py-10">
        <Container>
          <p className="text-sm font-medium text-smoke">Loading products…</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-lg border border-ink/8 bg-white"
              />
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
