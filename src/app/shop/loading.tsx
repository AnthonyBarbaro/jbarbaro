const loadingCards = Array.from({ length: 8 }, (_, index) => index);

export default function ShopLoading() {
  return (
    <div
      className="min-h-[calc(100vh-12rem)] bg-ivory"
      role="status"
      aria-label="Loading shop products"
    >
      <span className="sr-only">Loading shop products</span>

      <section className="border-b border-ink/10">
        <div className="mx-auto w-full max-w-[90rem] px-6 py-5 sm:px-6 lg:px-8 2xl:px-12">
          <div className="animate-pulse motion-reduce:animate-none" aria-hidden>
            <div className="h-8 w-64 rounded-md bg-stone" />
            <div className="mt-3 h-5 w-full max-w-xl rounded bg-stone" />
          </div>
        </div>
      </section>

      <section className="py-5 lg:py-6">
        <div className="mx-auto w-full max-w-[90rem] px-6 sm:px-6 lg:px-8 2xl:px-12">
          <div
            className="animate-pulse motion-reduce:animate-none lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-5"
            aria-hidden
          >
            <div className="hidden h-[28rem] rounded-lg border border-ink/10 bg-stone/70 lg:block" />
            <div className="grid grid-cols-1 gap-3 min-[22.5rem]:grid-cols-2 lg:grid-cols-3 lg:gap-4 min-[87.5rem]:grid-cols-4 min-[87.5rem]:gap-5">
              {loadingCards.map((card) => (
                <div
                  key={card}
                  className="overflow-hidden rounded-lg border border-ink/10 bg-white"
                >
                  <div className="aspect-[4/5] bg-product-canvas" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-24 rounded bg-stone" />
                    <div className="h-5 w-full rounded bg-stone" />
                    <div className="h-5 w-3/4 rounded bg-stone" />
                    <div className="h-6 w-20 rounded bg-stone" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
