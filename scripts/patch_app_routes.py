with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_scroll = """function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}"""

new_scroll = """function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const timer = setTimeout(() => {
        const delayedEl = document.getElementById(id);
        if (delayedEl) delayedEl.scrollIntoView({ behavior: 'smooth' });
      }, 180);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}"""

old_routes = """            {/* Fallback route */}
            <Route path="*" element={<Home />} />"""

new_routes = """            {/* Policy Direct Route Aliases */}
            <Route path="/shipping" element={<Navigate to="/about#shipping" replace />} />
            <Route path="/returns" element={<Navigate to="/about#refund" replace />} />
            <Route path="/refund" element={<Navigate to="/about#refund" replace />} />
            <Route path="/privacy" element={<Navigate to="/about#privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/about#terms" replace />} />
            <Route path="/fssai" element={<Navigate to="/about#fssai" replace />} />
            <Route path="/policies" element={<Navigate to="/about#shipping" replace />} />
            {/* Fallback route */}
            <Route path="*" element={<Home />} />"""

c_normalized = content.replace('\r\n', '\n')
if old_scroll in c_normalized and old_routes in c_normalized:
    c_normalized = c_normalized.replace(old_scroll, new_scroll).replace(old_routes, new_routes)
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(c_normalized)
    print('SUCCESS')
else:
    print('NOT_FOUND')
