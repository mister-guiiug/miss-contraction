export function AppFooter() {
  return (
    <footer className="footer footer--app">
      <p>
        Cet outil ne remplace pas un avis medical. Appelez la maternite ou le 15
        en cas de doute.
      </p>
      <p>
        <a
          className="footer-link"
          href="https://github.com/mister-guiiug/miss-contraction"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code source sur GitHub
        </a>{' '}
        ·{' '}
        <a
          className="footer-link"
          href="https://buymeacoffee.com/mister.guiiug"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy me a coffee
        </a>
      </p>
    </footer>
  );
}