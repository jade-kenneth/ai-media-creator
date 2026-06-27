import { LoginFormCard } from './login-form-card';

export function LoginPageView() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#f3f8ff]">
      <div className="absolute inset-0 bg-[#f3f8ff]" />
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[#f7fbff]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[280px] overflow-hidden opacity-100">
        <div className="absolute -bottom-[150px] -left-[15%] h-[250px] w-[58%] rounded-[999px] bg-[#d9ebff]" />
        <div className="absolute -bottom-[165px] left-[30%] h-[280px] w-[52%] rounded-[999px] bg-[#d9ebff]" />
        <div className="absolute -right-[12%] -bottom-[150px] h-[245px] w-[46%] rounded-[999px] bg-[#d9ebff]" />

        <div className="absolute inset-x-0 bottom-0 flex h-[170px] items-end justify-around px-5">
          <div className="h-[122px] w-10 bg-[#c5dcfb]/75" />
          <div className="h-[152px] w-[54px] bg-[#c5dcfb]/75" />
          <div className="h-[102px] w-[42px] bg-[#c5dcfb]/75" />
          <div className="h-[142px] w-12 bg-[#c5dcfb]/75" />
          <div className="h-[116px] w-[58px] bg-[#c5dcfb]/75" />
          <div className="h-[162px] w-[52px] bg-[#c5dcfb]/75" />
          <div className="h-[128px] w-[40px] bg-[#c5dcfb]/75" />
        </div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,251,255,0.12)_0%,rgba(243,248,255,0.3)_42%,rgba(160,197,240,0.16)_100%)]" />

      <section className="relative z-10 flex h-dvh w-full items-center justify-center px-4 py-4 lg:px-6 lg:py-6">
        <LoginFormCard />
      </section>
    </main>
  );
}
