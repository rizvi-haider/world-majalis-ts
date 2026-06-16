export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto my-12 px-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 border-b-2 border-gray-800 pb-2">About Us</h1>
      <p className="text-gray-700 text-lg">
        We have created an aggregated version of live and recorded Majalis over YouTube categorised by countries. This is a project currently in development by Aziz Rizvi (USA) and Haider Rizvi (India). It is live now for beta testing. Please use this and provide feedback on this. Select a country of your choice to view live and recorded majalises.
      </p>

      <p className="text-gray-700 text-lg">
        For Mobile devices scroll down from the clocks to the main videos section.
      </p>

      <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">In Loving Memory Of</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            <img src="/images/dad.jpg" alt="Naeem Rizvi" className="w-full h-64 object-cover"/>
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-2">Naeem Rizvi</h3>
              {/* <p className="text-gray-700">
                Your loving tribute text here, honoring your father and his memory.
              </p> */}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            <img src="/images/dada.jpg" alt="Hasan Haider" className="w-full h-64 object-cover"/>
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-2">Hasan Haider</h3>
              {/* <p className="text-gray-700">
                Add your grandparents’ names and a few meaningful words about them here.
              </p> */}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            <img src="/images/dadi.jpg" alt="Aziz Fatma" className="w-full h-64 object-cover"/>
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-2">Aziz Fatma</h3>
              {/* <p className="text-gray-700">
                Add your grandparents’ names and a few meaningful words about them here.
              </p> */}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            <img src="/images/nana.jpg" alt="Anwar Naqvi" className="w-full h-64 object-cover"/>
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-2">Anwar Naqvi</h3>
              {/* <p className="text-gray-700">
                Add your grandparents’ names and a few meaningful words about them here.
              </p> */}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            <img src="/images/nani.jpg" alt="Najma Naqvi" className="w-full h-64 object-cover"/>
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-2">Najma Naqvi</h3>
              {/* <p className="text-gray-700">
                Add your grandparents’ names and a few meaningful words about them here.
              </p> */}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}