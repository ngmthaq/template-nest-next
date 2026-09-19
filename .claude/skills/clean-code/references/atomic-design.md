# Atomic Design

Put all UI components into five levels, based on how complex they are and what they are made of.

## Atoms

The smallest elements. They cannot be split further. They work in any context and are fully reusable.

```javascript
function Button({ label, variant, onClick, disabled }) {
  return (
    <button className={variant} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

## Molecules

Small groups of atoms that work together as one unit. One clear purpose, very little internal state.

```javascript
function SearchField({ onSearch }) {
  const [query, setQuery] = useState("");
  return (
    <div>
      <Input value={query} onChange={setQuery} />
      <Button label="Search" onClick={() => onSearch(query)} />
    </div>
  );
}
```

## Organisms

Larger UI sections made of molecules and/or atoms. They may have business logic or state.

```javascript
function Header({ user, onSearch, onLogout }) {
  return (
    <header>
      <Logo />
      <NavBar items={mainNavItems} />
      <SearchField onSearch={onSearch} />
      <UserMenu user={user} onLogout={onLogout} />
    </header>
  );
}
```

## Templates

Page layouts. They get content through props/slots — no real data, no data fetching.

```javascript
function DashboardTemplate({ sidebar, header, mainContent, footer }) {
  return (
    <div className="dashboard-layout">
      <div className="sidebar">{sidebar}</div>
      <div className="main">
        {header}
        {mainContent}
        {footer}
      </div>
    </div>
  );
}
```

## Pages

Templates filled with real data, API calls, routing, and side effects.

```javascript
function DashboardPage() {
  const user = useCurrentUser();
  const stats = useDashboardStats();
  return (
    <DashboardTemplate
      sidebar={<Sidebar user={user} />}
      header={<Header user={user} onSearch={handleSearch} />}
      mainContent={<StatsGrid stats={stats} />}
      footer={<Footer />}
    />
  );
}
```

## Folder Structure

```text
components/
├── atoms/         # Button, Input, Icon, Badge
├── molecules/     # SearchField, FormField, NavItem
├── organisms/     # Header, ProductCard, CommentSection
├── templates/     # DashboardTemplate, AuthTemplate
└── pages/         # HomePage, UserProfilePage
```

## Atomic Design Rules

1. Before you create a component, find its level: "Is it built from other components? Which level are they?"
2. Atoms must never import other components from the same design system.
3. Molecules are built from atoms — never copy atom logic inline.
4. Templates get content through props/slots/children — never fetch data or hardcode organisms.
5. Pages are the **only** level that uses routing, data fetching, and global state.
6. Flag wrong levels: "This molecule imports an organism — the levels are upside down."
