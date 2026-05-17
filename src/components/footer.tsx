import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="px-4 lg:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo-smartcemetary.png" alt="Smart Cemetery" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="font-bold text-base text-primary">Smart Cemetery</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Sistem manajemen pemakaman digital modern yang memungkinkan pengelolaan data makam secara efisien.
            </p>
            <p className="text-xs text-slate-400">© 2026 Smart Cemetery</p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-4 uppercase tracking-wider">Menu</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-slate-500 hover:text-primary">Beranda</Link></li>
              <li><Link href="/makam" className="text-sm text-slate-500 hover:text-primary">Peta Makam</Link></li>
              <li><Link href="/auth/login" className="text-sm text-slate-500 hover:text-primary">Login</Link></li>
              <li><Link href="/auth/register" className="text-sm text-slate-500 hover:text-primary">Daftar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-4 uppercase tracking-wider">Kontak</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Jl. Raya Menur No.31A</li>
              <li>Manyar Sabrangan, Kec. Mulyorejo</li>
              <li>Surabaya, Jawa Timur 60285</li>
              <li>info@smartcemetery.id</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-4 uppercase tracking-wider">Lokasi</h4>
            <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.847894574764!2d112.7689!3d-7.2689!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7f9b3b3b3b3b3%3A0x2dd7f9b3b3b3b3b3!2sJl.%20Raya%20Menur%20No.31A%2C%20Manyar%20Sabrangan%2C%20Kec.%20Mulyorejo%2C%20Surabaya%2C%20Jawa%20Timur%2060285!5e0!3m2!1sen!2sid!4v1234567890"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">Sistem Manajemen Pemakaman Digital - All Rights Reserved</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-xs text-slate-400 hover:text-primary">Kebijakan Privasi</Link>
              <Link href="#" className="text-xs text-slate-400 hover:text-primary">Syarat & Ketentuan</Link>
              <Link href="#" className="text-xs text-slate-400 hover:text-primary">Bantuan</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}