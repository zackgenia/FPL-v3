interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-fpl-forest border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-500">{message}</p>
    </div>
  );
}
