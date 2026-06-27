import { Fragment, type ReactNode } from 'react';
import {
  useBoolean,
  useDebounceCallback,
  useIntersectionObserver,
} from 'usehooks-ts';

export interface InfiniteScrollProps {
  loader?: ReactNode;
  hasMore?: boolean;
  loadMore: () => Promise<void> | void;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function InfiniteScroll(props: InfiniteScrollProps) {
  const { value: loading, setValue: setLoading } = useBoolean(false);

  const loader = props.loader ?? null;
  const hasMore = props.hasMore ?? false;
  const loadMore = useDebounceCallback(async () => {
    if (loading) return;
    if (!hasMore) return;
    setLoading(true);
    await props.loadMore();
    setLoading(false);
  }, 300);

  const [ref] = useIntersectionObserver({
    onChange(isIntersecting) {
      if (isIntersecting) loadMore();
    },
  });

  return (
    <Fragment>
      {props.children}

      <div
        ref={ref}
        role="presentation"
        style={props.style}
        className={props.className}
        hidden={!hasMore}
      >
        {!!hasMore && <Fragment>{loader}</Fragment>}
      </div>
    </Fragment>
  );
}
