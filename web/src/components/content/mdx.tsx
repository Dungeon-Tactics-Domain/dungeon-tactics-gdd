// What every lab .mdx page gets without importing: styled Markdown elements (Tailwind's preflight strips lists and
// headings) and the shared content components. Internal links ("/modelos/...") go through the router, without a reload.
/* eslint-disable react-refresh/only-export-components -- the map is the export; A is a local helper, never hot-reloaded alone */
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { Callout } from './Callout';
import { DataTable, Rolagem, TABELA } from './DataTable';
import { Gallery } from './Gallery';
import { Player } from './Player';
import { Stars } from './Stars';
import { YouTubeEmbed } from './YouTubeEmbed';

const LINK = 'text-lab underline underline-offset-2';

function A({ href = '', children, ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/'))
    return (
      <Link to={href} className={LINK}>
        {children}
      </Link>
    );
  const fora = /^https?:/.test(href);
  return (
    <a href={href} className={LINK} {...(fora ? { target: '_blank', rel: 'noreferrer' } : {})} {...props}>
      {children}
    </a>
  );
}

export const MDX_COMPONENTS: MDXComponents = {
  a: A,
  p: (props) => <p className="m-0 max-w-[72ch]" {...props} />,
  h2: (props) => <h2 className="m-0 mt-2 text-[26px] leading-tight" {...props} />,
  h3: (props) => <h3 className="m-0 mt-1 text-[21px] leading-tight" {...props} />,
  ul: (props) => <ul className="m-0 grid max-w-[72ch] list-disc gap-1 pl-6" {...props} />,
  ol: (props) => <ol className="m-0 grid max-w-[72ch] list-decimal gap-1 pl-6" {...props} />,
  code: (props) => <code className="bg-terra px-1 text-[15px]" {...props} />,
  table: (props) => (
    <Rolagem>
      <table className={TABELA} {...props} />
    </Rolagem>
  ),
  Callout,
  DataTable,
  Gallery,
  Player,
  Stars,
  YouTubeEmbed,
};
