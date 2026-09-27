import Image from "next/image";

export default function Home() {
  return (
    <section className="w-full min-h-screen flex flex-col gap-4 justify-center items-center text-white">
      <h1 className="font-bold text-4xl lg:text-6xl">Track any price. Effortlessly.</h1>
      <h6 className="font-semibold text-md">Start tracking a product, or browse the prices we're already monitoring.</h6>
      <button className="bg-white text-black shadow-xl rounded-lg p-2">
        <a href="/home">View List</a>
      </button>
      <h3>or</h3>
      <div className="flex gap-2 items-center">
        <input type="text" className="bg-white p-2 rounded-lg outline-none text-black" />
        <button className="bg-white text-black shadow-xl rounded-lg p-2"> Track Price</button>
      </div>
    </section>
  );
}
