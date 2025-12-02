import Link from "next/link";
import { Shield, Github, FileText, Lock, Scale } from "lucide-react";

const footerLinks = {
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "Deployment Guide", href: "/docs/deployment" },
    { label: "Contributing", href: "https://github.com/PeekTower-HQ/crms/blob/main/CONTRIBUTING.md", external: true },
  ],
  legal: [
    { label: "MIT License", href: "https://github.com/PeekTower-HQ/crms/blob/main/LICENSE", external: true },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Security Policy", href: "/security" },
    { label: "Terms of Use", href: "/terms" },
  ],
  community: [
    { label: "GitHub", href: "https://github.com/PeekTower-HQ/crms", external: true },
    { label: "Discussions", href: "https://github.com/PeekTower-HQ/crms/discussions", external: true },
    { label: "Issues", href: "https://github.com/PeekTower-HQ/crms/issues", external: true },
    { label: "Releases", href: "https://github.com/PeekTower-HQ/crms/releases", external: true },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-700/30">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">CRMS</span>
            </Link>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Pan-African Digital Public Good for modern criminal records
              management.
            </p>
            <div className="flex items-center gap-2 text-sm bg-gray-800/50 rounded-full px-3 py-1.5 w-fit">
              <Scale className="h-4 w-4 text-green-400" />
              <span>SDG 16 Aligned</span>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">
              Resources
            </h3>
            <ul className="space-y-3.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-all duration-200 hover:translate-x-0.5 inline-block"
                    {...(link.external && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">
              Legal
            </h3>
            <ul className="space-y-3.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-all duration-200 hover:translate-x-0.5 inline-block"
                    {...(link.external && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">
              Community
            </h3>
            <ul className="space-y-3.5">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-all duration-200 hover:translate-x-0.5 inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CRMS. Open source under MIT License.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/PeekTower-HQ/crms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <span className="text-sm text-gray-500">
              Proudly Open Source
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
