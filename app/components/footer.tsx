import { Link } from "@remix-run/react";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { siteConfig } from "~/config/site";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Branding Section */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </Link>
            <p className="text-muted-foreground text-sm leading-6 max-w-xs">
              Стройте значимые связи с помощью иновационных решений.
            </p>
          </div>

          {/* Legal Navigation */}
          <nav className="space-y-2">
            <h3 className="text-sm font-medium">Компания</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  aria-label="Terms of Service"
                >
                  Правила использования
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  aria-label="Privacy Policy"
                >
                  Приватность
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Присойденяйтесь</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@yourbrand.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
                  aria-label="Contact support"
                >
                  <Mail className="h-4 w-4" />
                  Поддержка
                </a>
              </li>
              <li>
                <a
                  href="/careers"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  aria-label="Career opportunities"
                >
                  Карьера
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Соц. сети</h3>
            <div className="flex gap-4">
              <a
                href="https://github.com/your-username"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors duration-300"
                aria-label="GitHub profile"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/your-username"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors duration-300"
                aria-label="Twitter profile"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/your-brand"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors duration-300"
                aria-label="LinkedIn profile"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. Все права защищены.
            <span className="mx-2 hidden sm:inline-block">|</span>
            <span className="hidden sm:inline-block">Built with Remix</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
