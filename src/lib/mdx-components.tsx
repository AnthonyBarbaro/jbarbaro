import type { ComponentType } from "react";

type MdxProps = Record<string, unknown>;
export type MdxComponentMap = Record<string, ComponentType<MdxProps>>;

export function useMdxComponents(components: MdxComponentMap): MdxComponentMap {
  return {
    h2: (props) => <h2 className="mt-10 font-heading text-3xl leading-tight text-ink sm:mt-12 sm:text-4xl" {...props} />,
    h3: (props) => <h3 className="mt-8 font-heading text-2xl leading-tight text-ink sm:text-3xl" {...props} />,
    p: (props) => <p className="mt-5 text-[1rem] leading-7 text-smoke sm:text-[1.05rem] sm:leading-8" {...props} />,
    ul: (props) => <ul className="mt-5 list-disc space-y-2 pl-5 text-[1rem] leading-7 text-smoke sm:text-[1.04rem] sm:leading-8" {...props} />,
    ol: (props) => <ol className="mt-5 list-decimal space-y-2 pl-5 text-[1rem] leading-7 text-smoke sm:text-[1.04rem] sm:leading-8" {...props} />,
    a: (props) => <a className="text-deep-teal underline decoration-gold/65 underline-offset-4 hover:text-ink" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="mt-8 rounded-r-2xl border-l-4 border-gold bg-stone px-5 py-4 italic text-ink/85"
        {...props}
      />
    ),
    ...components,
  };
}
