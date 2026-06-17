import { cn } from '../../lib/cn';

type SkeletonShape = 'line' | 'circle' | 'block';

interface SkeletonProps {
  /** Visual shape. 'line' for text, 'circle' for avatars, 'block' for cards. */
  shape?: SkeletonShape;
  width?: number | string;
  height?: number | string;
  className?: string;
}

const shapeRadius: Record<SkeletonShape, string> = {
  line: 'rounded-md',
  circle: 'rounded-full',
  block: 'rounded-xl',
};

export function Skeleton({ shape = 'line', width, height, className = '' }: SkeletonProps) {
  const defaultHeight = shape === 'line' ? '0.85rem' : shape === 'circle' ? width : '100%';
  return (
    <span
      aria-hidden="true"
      className={cn('skeleton block', shapeRadius[shape], className)}
      style={{
        width: width ?? '100%',
        height: height ?? defaultHeight,
      }}
    />
  );
}

/** Convenience: a stack of text lines, last one shorter. */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} shape="line" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}
