import InternNav from "./_components/InternNav";

export default function InternLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InternNav />
      {children}
    </>
  );
}
