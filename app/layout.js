import { DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
});

export const metadata = {
  title: "PJ do Corte - Agende seu horario",
  description: "Barbearia PJ do Corte - Agendamento online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${bebasNeue.variable}`}>
        {children}
      </body>
    </html>
  );
}
