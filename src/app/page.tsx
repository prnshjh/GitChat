
import { auth } from "@clerk/nextjs/server";
import { Features } from "./components/features";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { HowItWorks } from "./components/how-it-works";
import { Navbar } from "./components/navbar";
import { redirect } from "next/navigation";




// export default async function Home() {

//   const { userId } =await  auth();
//     if (userId) {
//       return  redirect('/dashboard')
//     }
  
  
//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
//       <main>
//         <Hero />
//         <Features />
//         <HowItWorks />
//       </main>
//       <Footer />
//     </div>
//   )
// }
export default async function Home() {
  const { userId } = await auth();
  if (userId) return redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <Hero />
        <Features />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
}


