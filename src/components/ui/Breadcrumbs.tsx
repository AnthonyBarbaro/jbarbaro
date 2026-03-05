import Link from "next/link";

import { Container } from "@/components/ui/Container";

type BreadcrumbItem = {
  name: string;
  href: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length < 2) {
    return null;
  }

  return (
    <div className="border-b border-ink/10 bg-stone/55">
      <Container className="py-3">
        <nav aria-label="Breadcrumb" className="overflow-x-auto text-sm">
          <ol className="flex min-w-max items-center gap-2 text-smoke">
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <li key={item.href} className="flex items-center gap-2">
                  {isLast ? (
                    <span aria-current="page" className="font-semibold text-ink">
                      {item.name}
                    </span>
                  ) : (
                    <Link href={item.href} className="transition-colors hover:text-deep-teal">
                      {item.name}
                    </Link>
                  )}
                  {!isLast ? <span aria-hidden className="text-ink/35">/</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      </Container>
    </div>
  );
}
